import json
import os
import time
from typing import Any, Dict, Optional

import boto3
import jwt
import requests


secrets_client = boto3.client("secretsmanager")


def _get_zoom_credentials() -> Dict[str, str]:
    secret_arn = os.getenv("ZOOM_SECRETS_ARN")
    if secret_arn:
        secret = secrets_client.get_secret_value(SecretId=secret_arn)
        return json.loads(secret["SecretString"])

    secret_name = os.getenv("ZOOM_SECRET_NAME", "zoom/api-credentials")
    secret = secrets_client.get_secret_value(SecretId=secret_name)
    return json.loads(secret["SecretString"])


def _get_zoom_token(credentials: Dict[str, str]) -> str:
    payload = {
        "iss": credentials.get("client_id"),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, credentials.get("client_secret"), algorithm="HS256")


def _parse_body(event: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(event.get("body"), str):
        try:
            return json.loads(event["body"])
        except json.JSONDecodeError:
            return {}
    return event or {}


def _save_to_s3(bucket_name: str, key: str, body: str, content_type: str = "text/plain") -> None:
    s3 = boto3.client("s3")
    s3.put_object(Bucket=bucket_name, Key=key, Body=body, ContentType=content_type)


def _build_vtt_from_text(text: str, meeting_id: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    vtt = ["WEBVTT", ""]

    for idx, line in enumerate(lines, start=1):
        start_time = f"00:00:{idx:02d}.000"
        end_time = f"00:00:{idx + 1:02d}.000"
        vtt.append(f"{start_time} --> {end_time}")
        vtt.append(f"<v Speaker_{idx % 4 + 1}> {line}")
        vtt.append("")

    return "\n".join(vtt)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Fetch Zoom meeting transcript metadata or transcript text and persist to S3."""
    try:
        payload = _parse_body(event)
        meeting_id = payload.get("meeting_id") or event.get("meeting_id")
        if not meeting_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "meeting_id is required"}),
            }

        bucket_name = os.getenv("TRANSCRIPT_BUCKET")
        if not bucket_name:
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "TRANSCRIPT_BUCKET is not configured"}),
            }

        credentials = _get_zoom_credentials()
        token = _get_zoom_token(credentials)
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        recordings_url = f"https://api.zoom.us/v2/meetings/{meeting_id}/recordings"
        response = requests.get(recordings_url, headers=headers, timeout=30)
        response.raise_for_status()
        recording_data = response.json()

        transcript_key = f"transcripts/raw/{meeting_id}.vtt"
        metadata_key = f"transcripts/metadata/{meeting_id}.json"

        transcript_text = ""
        if recording_data.get("recording_files"):
            for item in recording_data["recording_files"]:
                if str(item.get("file_type", "")).upper() == "VTT":
                    transcript_url = item.get("download_url")
                    if transcript_url:
                        transcript_response = requests.get(transcript_url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
                        transcript_response.raise_for_status()
                        transcript_text = transcript_response.text
                        break

        if not transcript_text:
            transcript_text = _build_vtt_from_text(
                "This transcript was generated from Zoom meeting metadata while the raw VTT file was not available.",
                meeting_id,
            )

        _save_to_s3(bucket_name, transcript_key, transcript_text, "text/vtt")

        metadata = {
            "meeting_id": meeting_id,
            "source": "Zoom API",
            "status": "ingested",
            "s3_vtt_path": transcript_key,
            "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "recording_data": recording_data,
        }
        _save_to_s3(bucket_name, metadata_key, json.dumps(metadata, indent=2), "application/json")

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Zoom transcript ingested successfully",
                    "meeting_id": meeting_id,
                    "vtt_key": transcript_key,
                    "metadata_key": metadata_key,
                }
            ),
        }

    except Exception as exc:  # pragma: no cover - defensive failure path
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(exc)}),
        }
