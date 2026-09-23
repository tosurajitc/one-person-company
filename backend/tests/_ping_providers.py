import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

print("=== Provider Availability Check ===")

# Groq
groq_key = os.getenv("GROQ_API_KEY")
groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
if groq_key:
    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model=groq_model,
            messages=[{"role":"user","content":"say ok"}],
            max_tokens=5,
        )
        print(f"Groq [{groq_model}]: REACHABLE — {resp.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"Groq [{groq_model}]: FAILED — {e}")
else:
    print("Groq: no key")

# Anthropic
ant_key = os.getenv("ANTHROPIC_API_KEY")
ant_model = os.getenv("ANTHROPIC_HAIKU_MODEL", "claude-3-5-haiku-20241022")
if ant_key:
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ant_key)
        resp = client.messages.create(
            model=ant_model,
            max_tokens=10,
            messages=[{"role":"user","content":"say ok"}],
        )
        print(f"Anthropic [{ant_model}]: REACHABLE — {resp.content[0].text.strip()}")
    except Exception as e:
        print(f"Anthropic [{ant_model}]: FAILED — {e}")
else:
    print("Anthropic: no key")
