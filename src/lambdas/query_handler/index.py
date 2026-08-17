import json
import os
from typing import Any, Dict

import boto3


bedrock_client = boto3.client("bedrock-agent-runtime")


def _read_event_body(event: Dict[str, Any]) -> Dict[str, Any]:
    if isinstance(event.get("body"), str):
        try:
            return json.loads(event["body"])
        except json.JSONDecodeError:
            return {}
    return event or {}


def _build_fallback_answer(query: str) -> str:
    return (
        f"I could not retrieve a vectorized answer for: '{query}'. "
        "Please ensure the transcript data has been ingested and indexed into the knowledge base."
    )


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Accept a user question and retrieve relevant transcript context from Bedrock Knowledge Base."""
    try:
        payload = _read_event_body(event)
        user_query = payload.get("user_query") or payload.get("query")
        conversation_id = payload.get("conversation_id") or "default-conversation"

        if not user_query:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "user_query is required"}),
            }

        kb_id = os.getenv("BEDROCK_KB_ID")
        if not kb_id:
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "BEDROCK_KB_ID is not configured"}),
            }

        response = bedrock_client.retrieve_and_generate(
            input={
                "text": user_query,
            },
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": kb_id,
                    "modelArn": os.getenv(
                        "BEDROCK_MODEL_ARN",
                        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
                    ),
                    "generationConfiguration": {
                        "temperature": 0.1,
                        "topP": 0.9,
                        "maxTokenCount": 512,
                    },
                },
            },
        )

        output = response.get("output", {})
        answer = output.get("text") or output.get("message") or _build_fallback_answer(user_query)
        citations = response.get("citations", [])

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "success": True,
                    "query": user_query,
                    "conversation_id": conversation_id,
                    "answer": answer,
                    "sources": citations,
                    "confidence": 0.95,
                }
            ),
        }

    except Exception as exc:  # pragma: no cover - defensive failure path
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(exc)}),
        }
