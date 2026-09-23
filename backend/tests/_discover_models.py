import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

print("=== Groq available models ===")
groq_key = os.getenv("GROQ_API_KEY")
if groq_key:
    from groq import Groq
    client = Groq(api_key=groq_key)
    models = client.models.list()
    for m in sorted(models.data, key=lambda x: x.id):
        print(" ", m.id)

print("\n=== Anthropic — trying current model names ===")
ant_key = os.getenv("ANTHROPIC_API_KEY")
candidates = [
    "claude-haiku-4-5",
    "claude-3-haiku-20240307",
    "claude-3-5-haiku-latest",
    "claude-haiku-4-20250514",
    "claude-3-sonnet-20240229",
    "claude-sonnet-4-5",
    "claude-3-5-sonnet-20241022",
    "claude-sonnet-4-20250514",
]
if ant_key:
    import anthropic
    client = anthropic.Anthropic(api_key=ant_key)
    for m in candidates:
        try:
            resp = client.messages.create(
                model=m, max_tokens=5,
                messages=[{"role":"user","content":"ok"}],
            )
            print(f"  {m}: OK — {resp.content[0].text.strip()}")
            break
        except Exception as e:
            short = str(e)[:80]
            print(f"  {m}: {short}")
