import argparse
import secrets

from database import init_db, get_db
from models import UserModel, BotModel


def _bot_exists_for_creator(creator_id: int, name: str) -> bool:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id FROM bots WHERE creator_id = ? AND name = ? LIMIT 1",
        (creator_id, name),
    )
    return cursor.fetchone() is not None


def seed_products():
    print("Skipping product seeding (legacy product catalog removed from this script).")


def seed_bots(creator_email: str, creator_name: str, creator_password: str | None = None):
    """Seed sample bots for demonstration"""
    print("Seeding bots...")

    # Create seed creator if not exists
    demo_user = UserModel.get_by_email(creator_email)
    if not demo_user:
        generated_password = creator_password or secrets.token_urlsafe(12)
        user_id = UserModel.create(
            email=creator_email,
            password=generated_password,
            full_name=creator_name
        )
        print(f"  ✓ Created seed creator: {creator_email}")
        if not creator_password:
            print(f"  ! Generated creator password: {generated_password}")
    else:
        user_id = demo_user["id"]
        print(f"  - Using existing creator: {creator_email}")

    bots = [
        {
            "name": "Customer Support Assistant",
            "description": "A helpful bot that provides 24/7 customer support, answers FAQs, and helps resolve common issues quickly.",
            "category": "Customer Support",
            "creator_id": user_id,
            "system_prompt": "You are a friendly and professional customer support assistant. Help users with their questions, provide clear solutions, and maintain a positive attitude. If you don't know something, politely ask for more details.",
            "ai_model": "gpt-4.1-mini",
            "temperature": 0.7,
            "max_tokens": 500,
            "price": 0.0,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=customer",
            "welcome_message": "Hello! I'm here to help with any questions or issues you may have. How can I assist you today?",
            "fallback_response": "I apologize, but I'm having trouble understanding. Could you please rephrase your question?"
        },
        {
            "name": "Python Programming Tutor",
            "description": "Learn Python programming with this interactive tutor. Get help with code, understand concepts, and practice exercises.",
            "category": "Education & Tutoring",
            "creator_id": user_id,
            "system_prompt": "You are an experienced Python programming tutor. Explain concepts clearly, provide code examples, and help students debug their code. Be patient, encouraging, and adapt explanations to the student's level.",
            "ai_model": "gpt-4.1",
            "temperature": 0.6,
            "max_tokens": 800,
            "price": 9.99,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=python",
            "welcome_message": "Welcome to Python Programming Tutor! I'm here to help you learn Python. What would you like to work on today?",
            "fallback_response": "Let me think about that Python question differently. Can you provide more context or a code example?"
        },
        {
            "name": "Creative Writing Coach",
            "description": "Enhance your writing skills with personalized feedback, story ideas, and character development guidance.",
            "category": "Creative Writing",
            "creator_id": user_id,
            "system_prompt": "You are a creative writing coach who helps writers improve their craft. Provide constructive feedback, suggest plot ideas, help with character development, and inspire creativity. Be supportive and encouraging.",
            "ai_model": "gpt-5-mini",
            "temperature": 0.9,
            "max_tokens": 1000,
            "price": 14.99,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=writer",
            "welcome_message": "Hello, creative mind! I'm your writing coach. Share your ideas, drafts, or questions, and let's craft something amazing together!",
            "fallback_response": "That's an interesting creative direction! Could you elaborate more so I can provide better guidance?"
        },
        {
            "name": "Fitness & Nutrition Guide",
            "description": "Get personalized fitness advice, workout plans, and nutrition tips to achieve your health goals.",
            "category": "Health & Wellness",
            "creator_id": user_id,
            "system_prompt": "You are a certified fitness trainer and nutrition expert. Provide safe, evidence-based advice on workouts, meal planning, and healthy habits. Always remind users to consult healthcare professionals for medical concerns.",
            "ai_model": "gpt-4.1-mini",
            "temperature": 0.7,
            "max_tokens": 600,
            "price": 0.0,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=fitness",
            "welcome_message": "Hi there! Ready to work on your fitness goals? I can help with workouts, nutrition, and healthy lifestyle tips. What's your goal?",
            "fallback_response": "I want to make sure I give you the best advice. Could you provide more details about your fitness level or goals?"
        },
        {
            "name": "Swimming Trainer Bot",
            "description": "Personal swim coach for freestyle, breathing, endurance, and structured pool training plans.",
            "category": "Sports & Coaching",
            "creator_id": user_id,
            "system_prompt": "You are an expert swimming coach focused on safe, practical swim training. Help users improve freestyle technique, breathing rhythm, body position, kick efficiency, pacing, and interval planning. Ask about current level, access to pool, and any injuries before prescribing plans. Give clear sets with reps, distance, rest, and intensity. Keep advice motivational and concise. Always include a short safety reminder to stop if there is pain, dizziness, or breathing distress and consult a qualified coach or clinician for medical concerns.",
            "ai_model": "gpt-4.1-mini",
            "temperature": 0.6,
            "max_tokens": 700,
            "price": 4.99,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=swim-coach",
            "welcome_message": "Welcome to Swimming Trainer Bot! Tell me your level (beginner/intermediate/advanced), your goal, and how many sessions per week you can do.",
            "fallback_response": "I can help best with a bit more detail—what stroke are you focusing on, and what distance can you currently swim comfortably?"
        },
        {
            "name": "Marketing Strategy Advisor",
            "description": "Expert marketing advice for businesses. Get help with campaigns, social media, SEO, and growth strategies.",
            "category": "Sales & Marketing",
            "creator_id": user_id,
            "system_prompt": "You are a marketing strategist with expertise in digital marketing, social media, SEO, and brand strategy. Provide actionable advice, innovative ideas, and data-driven recommendations for businesses of all sizes.",
            "ai_model": "gpt-4.1",
            "temperature": 0.8,
            "max_tokens": 700,
            "price": 19.99,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=marketing",
            "welcome_message": "Welcome! I'm your marketing strategy advisor. Tell me about your business and marketing challenges, and I'll help you create winning strategies!",
            "fallback_response": "Let me approach this from a different marketing angle. Can you share more about your target audience or business goals?"
        },
        {
            "name": "Mental Wellness Companion",
            "description": "A supportive companion for mental wellness. Practice mindfulness, manage stress, and improve emotional well-being.",
            "category": "Health & Wellness",
            "creator_id": user_id,
            "system_prompt": "You are a compassionate mental wellness companion. Provide emotional support, mindfulness exercises, and stress management techniques. Be empathetic and encouraging. Always remind users to seek professional help for serious mental health concerns.",
            "ai_model": "gpt-4.1-mini",
            "temperature": 0.8,
            "max_tokens": 500,
            "price": 0.0,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=wellness",
            "welcome_message": "Hello, friend. I'm here to support your mental wellness journey. How are you feeling today?",
            "fallback_response": "I hear you. Let's take a moment together. Would you like to talk more about what's on your mind?"
        },
        {
            "name": "Business Plan Generator",
            "description": "Create comprehensive business plans with market analysis, financial projections, and strategic recommendations.",
            "category": "Finance",
            "creator_id": user_id,
            "system_prompt": "You are a business consultant specializing in business planning. Help entrepreneurs create detailed business plans including market analysis, competitive landscape, financial projections, and growth strategies. Be thorough and professional.",
            "ai_model": "gpt-5-mini",
            "temperature": 0.7,
            "max_tokens": 1200,
            "price": 29.99,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=business",
            "welcome_message": "Welcome! I'm your business planning expert. Let's build a solid business plan for your venture. What's your business idea?",
            "fallback_response": "To create the best business plan, I need a bit more information. Can you tell me more about your target market or business model?"
        },
        {
            "name": "Trivia Game Master",
            "description": "Play interactive trivia games across various topics. Challenge yourself and learn fun facts!",
            "category": "Entertainment",
            "creator_id": user_id,
            "system_prompt": "You are an enthusiastic trivia game master. Ask engaging trivia questions across various topics, keep score, provide interesting facts, and make learning fun. Be energetic and encouraging!",
            "ai_model": "gpt-4.1-mini",
            "temperature": 0.8,
            "max_tokens": 400,
            "price": 0.0,
            "is_public": True,
            "avatar_url": "https://api.dicebear.com/7.x/bottts/svg?seed=trivia",
            "welcome_message": "Hey there, trivia fan! Ready to test your knowledge? Pick a category or let me surprise you with random questions!",
            "fallback_response": "Hmm, that's a tricky one! Let me ask you another question to keep the game rolling!"
        }
    ]

    created_count = 0
    skipped_count = 0
    for bot in bots:
        if _bot_exists_for_creator(bot["creator_id"], bot["name"]):
            skipped_count += 1
            print(f"  - Skipped existing bot: {bot['name']}")
            continue

        bot_id = BotModel.create(**bot)
        if bot_id:
            created_count += 1
            print(f"  ✓ Created bot: {bot['name']}")

    print(f"Bot seeding complete. Created: {created_count}, skipped existing: {skipped_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed backend demo data")
    parser.add_argument(
        "--creator-email",
        required=True,
        help="Email for bot creator account used during seeding",
    )
    parser.add_argument(
        "--creator-name",
        default="Bot Seed Creator",
        help="Full name for bot creator account used during seeding",
    )
    parser.add_argument(
        "--creator-password",
        default=None,
        help="Optional password for new creator account; if omitted, a secure password is generated",
    )
    parser.add_argument(
        "--with-products",
        action="store_true",
        help="Run legacy product seeding placeholder (currently no-op)",
    )
    args = parser.parse_args()

    init_db()
    if args.with_products:
        seed_products()
    seed_bots(
        creator_email=args.creator_email,
        creator_name=args.creator_name,
        creator_password=args.creator_password,
    )