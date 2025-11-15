from langchain_chroma import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import OllamaLLM
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pathlib import Path
import requests
import sys


class ProtocolRAG:
    def __init__(self, knowledge_base_path="./knowledge-base", model_name="mistral"):
        self.knowledge_base_path = Path(knowledge_base_path)
        self.model_name = model_name

        self.chat_histories = {}

        if not self._check_ollama_running():
            print("Ollama is not running!")
            sys.exit(1)

        # Check if model exists
        if not self._check_model_exists(model_name):
            print(f" Model '{model_name}' not found!")
            sys.exit(1)

        print("Initializing embeddings model...")
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cuda'}
        )

        print(f"Connecting to Ollama with model {model_name}...")
        self.llm = OllamaLLM(
            model=model_name,
            temperature=0.1,
        )

        print("Loading knowledge base...")
        self.vectorstore = self._load_knowledge_base()
        print("RAG system initialized successfully!")

    def _check_ollama_running(self) -> bool:
        try:
            response = requests.get("http://localhost:11434", timeout=2)
            return True
        except:
            return False

    def _check_model_exists(self, model_name: str) -> bool:
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=2)
            if response.status_code == 200:
                models = response.json().get('models', [])
                return any(model['name'] == model_name for model in models)
            return False
        except:
            return False

    def _load_knowledge_base(self):
        documents = []

        for md_file in self.knowledge_base_path.glob("*.md"):
            print(f"Loading {md_file.name}...")
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
                documents.append({
                    'content': content,
                    'source': md_file.name
                })

        if not documents:
            raise ValueError(f"No markdown files found in {self.knowledge_base_path}")

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n## ", "\n### ", "\n\n", "\n", " ", ""]
        )

        texts = []
        metadatas = []
        for doc in documents:
            chunks = text_splitter.split_text(doc['content'])
            texts.extend(chunks)
            metadatas.extend([{'source': doc['source']}] * len(chunks))

        print(f"Created {len(texts)} chunks from {len(documents)} documents")

        vectorstore = Chroma.from_texts(
            texts=texts,
            embedding=self.embeddings,
            metadatas=metadatas,
            persist_directory="./chroma_db"
        )

        return vectorstore

    def _get_history(self, session_id):
        if session_id not in self.chat_histories:
            self.chat_histories[session_id] = []
        return self.chat_histories[session_id]

    def is_simple_message(self, message: str) -> bool:
        simple_messages = ["hi", "hello", "hey", "thanks", "thank you", "good morning", "good evening"]
        return message.strip().lower() in simple_messages

    def simple_reply(self, message: str) -> str:
        replies = {
            "hi": "Hello! How can I help you today?",
            "hello": "Hi there! What would you like to know?",
            "hey": "Hey! How’s it going?",
            "thanks": "You’re welcome!",
            "thank you": "Happy to help!"
        }
        return replies.get(message.strip().lower(), "Hello!")


    def _rewrite_question(self, history, question):
        if not history:
            return question  # nothing to rewrite

        history_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history])

        prompt = f"""
Rewrite the user's question so it becomes a standalone question.
Use the conversation history to resolve references.

CONVERSATION:
{history_text}

USER QUESTION:
{question}

Standalone rewritten question:
"""
        rewritten = self.llm.invoke(prompt)
        return rewritten.strip()


    def general_query(self, question, session_id="general"):
        if self.is_simple_message(question):
            return {
                "answer": self.simple_reply(question),
                "sources": []
            }

        history = self._get_history(session_id)

        rewritten = self._rewrite_question(history, question)

        docs = self.vectorstore.similarity_search(rewritten, k=4)
        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = f"""
You are a knowledgeable assistant about a Sui stablecoin protocol.
Answer the user question using ONLY the documentation.

DOCUMENTATION:
{context}

USER QUESTION:
{question}
    
    INSTRUCTIONS:
1. Answer based ONLY on the provided documentation
2. Answer in no more than 5 phrases
3. Provide specific numbers and actionable advice
4. If recommending actions, calculate exact amounts needed
5. Warn about risks when health factor is low (< 1.5)
6. If you cannot find the answer in the documentation, say so
7. Be concise but complete
    
ANSWER:
"""

        response = self.llm.invoke(prompt)

        # Save memory
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": response})

        return {
            "answer": response,
            "sources": list(set([doc.metadata.get("source") for doc in docs]))
        }


    def personalized_query(self, question, user_position, protocol_params, session_id):
        if self.is_simple_message(question):
            return {
                "answer": self.simple_reply(question),
                "sources": []
            }

        history = self._get_history(session_id)

        rewritten = self._rewrite_question(history, question)

        docs = self.vectorstore.similarity_search(rewritten, k=4)
        context = "\n\n".join([doc.page_content for doc in docs])

        position_str = f"""
- Collateral: {user_position.get('collateral', 'Unknown')}
- Collateral Value: ${user_position.get('collateral_value', 0):,.2f}
- Borrowed Amount: ${user_position.get('borrowed_amount', 0):,.2f}
- Health Factor: {user_position.get('health_factor', 0):.2f}
"""

        params_str = f"""
- Liquidation Threshold: {protocol_params.get('liquidation_threshold', 0.80):.0%}
- Minimum Health Factor: {protocol_params.get('min_health_factor', 1.0)}
"""

        prompt = f"""
You are a personalized assistant for a Sui stablecoin protocol.

DOCUMENTATION:
{context}

USER POSITION:
{position_str}

PROTOCOL PARAMETERS:
{params_str}

ORIGINAL QUESTION:
{question}


INSTRUCTIONS:
1. Answer based ONLY on the documentation and the provided user data
2. Answer in no more than 5 phrases
3. Provide specific numbers and highly actionable advice
4. If recommending actions, calculate exact amounts needed
5. Warn the user when their health factor is low (< 1.5)
6. If you cannot find the answer in the documentation, say so
7. Be concise but complete

ANSWER:
"""
        response = self.llm.invoke(prompt)

        # Save memory
        history.append({"role": "user", "content": question})
        history.append({"role": "assistant", "content": response})

        return {
            "answer": response,
            "sources": list(set([doc.metadata.get("source") for doc in docs]))
        }


    def query(self, question, user_position, protocol_params):

        docs = self.vectorstore.similarity_search(question, k=4)
        context = "\n\n".join([doc.page_content for doc in docs])

        position_str = f"""
- Collateral: {user_position.get('collateral', 'Unknown')}
- Collateral Value: ${user_position.get('collateral_value', 0):,.2f}
- Borrowed Amount: ${user_position.get('borrowed_amount', 0):,.2f}
- Current Health Factor: {user_position.get('health_factor', 0):.2f}
- Collateral Asset: {user_position.get('collateral_asset', 'Unknown')}
"""

        params_str = f"""
- Liquidation Threshold: {protocol_params.get('liquidation_threshold', 0.80):.0%}
- Minimum Health Factor: {protocol_params.get('min_health_factor', 1.0)}
- Maximum Health Factor: {protocol_params.get('max_health_factor', 999)}

"""

        prompt = f"""You are a helpful and knowledgeable assistant for a Sui stablecoin protocol. Use the following protocol documentation to answer the user's question accurately.

PROTOCOL DOCUMENTATION:
{context}



CURRENT USER POSITION:
{position_str}

CURRENT PROTOCOL PARAMETERS:
{params_str}

USER QUESTION: {question}

INSTRUCTIONS:
1. Answer based ONLY on the provided documentation
2. Answer in no more than 5 phrases
3. Provide specific numbers and actionable advice
4. If recommending actions, calculate exact amounts needed
5. Warn about risks when health factor is low (< 1.5)
6. If you cannot find the answer in the documentation, say so
7. Be concise but complete

ANSWER:"""

        try:
            response = self.llm.invoke(prompt)
        except Exception as e:
            print(f"Error during LLM invocation: {e}")
            response = "I apologize, but I encountered an error while processing your question. Please make sure Ollama is running (ollama serve)."

        sources = list(set([doc.metadata.get('source', 'Unknown') for doc in docs]))

        return {
            "answer": response,
            "sources": sources
        }

    def reload_knowledge_base(self):
        print("Reloading knowledge base...")
        self.vectorstore = self._load_knowledge_base()
        print("Knowledge base reloaded successfully")


if __name__ == "__main__":
    print("="*60)
    print("Starting Protocol RAG System")
    print("="*60 + "\n")

    rag = ProtocolRAG()

    user_position = {
        'collateral_value': 10000,
        'borrowed_amount': 6000,
        'health_factor': 1.33,
        'collateral_asset': 'SUI',
        'liquidation_price': 7.5
    }

    protocol_params = {
        'liquidation_threshold': 0.80,
        'liquidation_penalty': 0.10,
        'min_health_factor': 1.0,
        'borrow_rate': 0.05
    }

    question = "How much more collateral do I need to deposit to reach a health factor of 1.5?"

    print("\nQuerying RAG system...")
    result = rag.query(question, user_position, protocol_params)
    print("\n" + "="*60)
    print("ANSWER:")
    print("="*60)
    print(result["answer"])
    print("\n" + "="*60)
    print("SOURCES:", result["sources"])
    print("="*60)