from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional, Any
from rag_engine import ProtocolRAG
import uvicorn

app = FastAPI(title="Sui Protocol AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rag_engine = ProtocolRAG(
    knowledge_base_path="./knowledge-base",
    model_name="qwen3:8b" #llama3.1:8b"  # or "mistral:latest", "llama2", etc.
)


class ChatRequest(BaseModel):
    message: str
    user_position: Optional[Dict[str, Any]] = None
    protocol_params: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list
    health_warning: Optional[str] = None


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Scenario A — General chat (no user info)
        if not request.user_position or not request.protocol_params:
            result = rag_engine.general_query(
                question=request.message,
                session_id="general"   # all guests share general chat memory
            )

            return ChatResponse(
                answer=result["answer"],
                sources=result["sources"],
                health_warning=None
            )

        # Scenario B — Personalized chat (user logged in)
        else:
            result = rag_engine.personalized_query(
                question=request.message,
                user_position=request.user_position,
                protocol_params=request.protocol_params,
                session_id=request.session_id   # each user has their own memory
            )

            # Personalized health warnings
            health_warning = None
            hf = request.user_position.get('health_factor', 0)
            if hf < 1.1:
                health_warning = "🚨 CRITICAL: Your position is at immediate risk of liquidation!"
            elif hf < 1.3:
                health_warning = "⚠️ WARNING: You   r position has elevated risk. Consider adding collateral or repaying debt."
            elif hf < 1.5:
                health_warning = "⚡ CAUTION: Your health factor is below the recommended safety threshold."

            return ChatResponse(
                answer=result["answer"],
                sources=result["sources"],
                health_warning=health_warning
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# @app.post("/api/chat", response_model=ChatResponse)
# async def chat(request: ChatRequest):
#     try:
#         result = rag_engine.query(
#             question=request.message,
#             user_position=request.user_position,
#             protocol_params=request.protocol_params
#         )
#
#         # Add health warning if HF is low
#         health_warning = None
#         hf = request.user_position.get('health_factor', 0)
#         if hf < 1.1:
#             health_warning = "🚨 CRITICAL: Your position is at immediate risk of liquidation!"
#         elif hf < 1.3:
#             health_warning = "⚠️ WARNING: Your position has elevated risk. Consider adding collateral or repaying debt."
#         elif hf < 1.5:
#             health_warning = "⚡ CAUTION: Your health factor is below the recommended safety threshold."
#
#         return ChatResponse(
#             answer=result["answer"],
#             sources=result["sources"],
#             health_warning=health_warning
#         )
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reload-knowledge")
async def reload_knowledge():
    try:
        rag_engine.reload_knowledge_base()
        return {"status": "success", "message": "Knowledge base reloaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "model": "Ollama - llama3.1:8b"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)