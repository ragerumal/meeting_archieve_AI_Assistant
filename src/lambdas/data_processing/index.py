import json
import os
from typing import Any, Dict, List

import boto3


s3_client = boto3.client("s3")


def _read_s3_object(bucket: str, key: str) -> str:
    response = s3_client.get_object(Bucket=bucket, Key=key)
    return response["Body"].read().decode("utf-8")


def _parse_vtt(vtt_text: str) -> List[Dict[str, str]]:
    lines = [line.strip() for line in vtt_text.splitlines() if line.strip()]
    entries: List[Dict[str, str]] = []
    current: Dict[str, str] = {}

    for line in lines:
        if line.startswith("WEBVTT"):
            continue
        if "-->" in line:
            if current:
                entries.append(current)
            current = {"timestamp": line}
            continue
        if line.startswith("<v "):
            speaker = line[3:].split(">", 1)[0].strip()
            text = line.split(">", 1)[1].strip() if ">" in line else ""
            current["speaker"] = speaker
            current["content"] = text
            continue
        if current:
            current["content"] = f"{current.get('content', '').strip()} {line}".strip()

    if current:
        entries.append(current)

    return entries


def _chunk_text(content: str, chunk_size: int = 600) -> List[str]:
    words = content.split()
    chunks: List[str] = []
    current: List[str] = []

    for word in words:
        current.append(word)
        if len(" ".join(current)) >= chunk_size:
            chunks.append(" ".join(current))
            current = []

    if current:
        chunks.append(" ".join(current))

    return chunks or [content]


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Parse uploaded VTT transcript, chunk content, and prepare it for vector indexing."""
    try:
        records = event.get("Records", [])
        if not records:
            return {"statusCode": 400, "body": json.dumps({"error": "No S3 records found"})}

        bucket_name = records[0]["s3"]["bucket"]["name"]
        object_key = records[0]["s3"]["object"]["key"]

        if not object_key.endswith(".vtt"):
            return {"statusCode": 200, "body": json.dumps({"message": "Skipped non-VTT file"})}

        transcript_text = _read_s3_object(bucket_name, object_key)
        entries = _parse_vtt(transcript_text)

        chunks: List[Dict[str, Any]] = []
        for idx, entry in enumerate(entries, start=1):
            content = entry.get("content", "")
            for chunk_index, chunk in enumerate(_chunk_text(content), start=1):
                chunks.append(
                    {
                        "chunk_id": f"{object_key}:{idx}:{chunk_index}",
                        "speaker": entry.get("speaker", "Unknown Speaker"),
                        "timestamp": entry.get("timestamp", "00:00:00.000 --> 00:00:00.000"),
                        "content": chunk,
                    }
                )

        kb_id = os.getenv("BEDROCK_KB_ID")
        result = {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Transcript processed successfully",
                    "bucket": bucket_name,
                    "key": object_key,
                    "entries_count": len(entries),
                    "chunks_count": len(chunks),
                    "knowledge_base_id": kb_id,
                    "chunks": chunks[:5],
                }
            ),
        }
        return result

    except Exception as exc:  # pragma: no cover - defensive failure path
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(exc)}),
        }
