from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Tailor API is running"}