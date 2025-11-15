from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
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
    user_position: Dict
    protocol_params: Dict

class ChatResponse(BaseModel):
    answer: str
    sources: list
    health_warning: Optional[str] = None

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        result = rag_engine.query(
            question=request.message,
            user_position=request.user_position,
            protocol_params=request.protocol_params
        )

        # Add health warning if HF is low
        health_warning = None
        hf = request.user_position.get('health_factor', 0)
        if hf < 1.1:
            health_warning = "🚨 CRITICAL: Your position is at immediate risk of liquidation!"
        elif hf < 1.3:
            health_warning = "⚠️ WARNING: Your position has elevated risk. Consider adding collateral or repaying debt."
        elif hf < 1.5:
            health_warning = "⚡ CAUTION: Your health factor is below the recommended safety threshold."

        return ChatResponse(
            answer=result["answer"],
            sources=result["sources"],
            health_warning=health_warning
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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