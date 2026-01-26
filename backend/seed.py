from database import init_db
from models import ProductModel, UserModel, BotModel
import json

def seed_products():
    init_db()

    products = [
        {
            "name": "Wireless Bluetooth Headphones",
            "description": "Premium noise-cancelling wireless headphones with 30-hour battery life",
            "price": 89.99,
            "category": "Electronics",
            "stock": 50,
            "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
        },
        {
            "name": "Smart Watch Series 5",
            "description": "Feature-rich smartwatch with health tracking and GPS",
            "price": 299.99,
            "category": "Electronics",
            "stock": 30,
            "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
        },
        {
            "name": "Laptop Stand Aluminum",
            "description": "Ergonomic aluminum laptop stand with adjustable height",
            "price": 45.99,
            "category": "Accessories",
            "stock": 100,
            "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500"
        },
        {
            "name": "USB-C Hub 7-in-1",
            "description": "Multi-port USB-C hub with HDMI, USB 3.0, and SD card reader",
            "price": 39.99,
            "category": "Accessories",
            "stock": 75,
            "image_url": "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=500"
        },
        {
            "name": "Mechanical Keyboard RGB",
            "description": "Gaming mechanical keyboard with customizable RGB lighting",
            "price": 129.99,
            "category": "Electronics",
            "stock": 40,
            "image_url": "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500"
        },
        {
            "name": "Wireless Mouse Ergonomic",
            "description": "Comfortable wireless mouse with precision tracking",
            "price": 34.99,
            "category": "Accessories",
            "stock": 120,
            "image_url": "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500"
        },
        {
            "name": "4K Webcam Pro",
            "description": "Professional 4K webcam with auto-focus and noise reduction",
            "price": 149.99,
            "category": "Electronics",
            "stock": 25,
            "image_url": "https://images.unsplash.com/photo-1587588354456-ae376af71a25?w=500"
        },
        {
            "name": "Portable SSD 1TB",
            "description": "High-speed portable SSD with USB-C connection",
            "price": 119.99,
            "category": "Storage",
            "stock": 60,
            "image_url": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500"
        },
        {
            "name": "Phone Stand Adjustable",
            "description": "Universal phone stand with adjustable viewing angles",
            "price": 19.99,
            "category": "Accessories",
            "stock": 150,
            "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500"
        },
        {
            "name": "LED Desk Lamp",
            "description": "Smart LED desk lamp with touch controls and timer",
            "price": 54.99,
            "category": "Accessories",
            "stock": 80,
            "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500"
        },
        {
            "name": "Laptop Sleeve 15 inch",
            "description": "Waterproof laptop sleeve with extra pockets",
            "price": 24.99,
            "category": "Accessories",
            "stock": 200,
            "image_url": "https://images.unsplash.com/photo-1517502166878-35c93a0072f0?w=500"
        },
        {
            "name": "Wireless Charger Pad",
            "description": "Fast wireless charging pad compatible with all Qi devices",
            "price": 29.99,
            "category": "Electronics",
            "stock": 90,
            "image_url": "https://images.unsplash.com/photo-1591290619762-d2c5ab610327?w=500"
        },
        {
            "name": "Monitor Screen Protector",
            "description": "Anti-glare screen protector for 24-inch monitors",
            "price": 32.99,
            "category": "Accessories",
            "stock": 70,
            "image_url": "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=500"
        },
        {
            "name": "Cable Management Box",
            "description": "Organize cables and power strips in style",
            "price": 22.99,
            "category": "Accessories",
            "stock": 110,
            "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
        },
        {
            "name": "Bluetooth Speaker Portable",
            "description": "Waterproof portable speaker with 12-hour battery",
            "price": 69.99,
            "category": "Electronics",
            "stock": 55,
            "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500"
        },
        {
            "name": "Screen Cleaning Kit",
            "description": "Professional screen cleaning solution and microfiber cloth",
            "price": 14.99,
            "category": "Accessories",
            "stock": 180,
            "image_url": "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?w=500"
        },
        {
            "name": "Gaming Mouse Pad XXL",
            "description": "Extra-large gaming mouse pad with anti-slip base",
            "price": 27.99,
            "category": "Accessories",
            "stock": 95,
            "image_url": "https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=500"
        },
        {
            "name": "External Hard Drive 2TB",
            "description": "Reliable external HDD for backup and storage",
            "price": 79.99,
            "category": "Storage",
            "stock": 45,
            "image_url": "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=500"
        },
        {
            "name": "Drawing Tablet Digital",
            "description": "Professional drawing tablet with pressure sensitivity",
            "price": 199.99,
            "category": "Electronics",
            "stock": 20,
            "image_url": "https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=500"
        },
        {
            "name": "Webcam Privacy Cover",
            "description": "Sliding privacy cover for laptop and desktop webcams",
            "price": 9.99,
            "category": "Accessories",
            "stock": 250,
            "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500"
        },
        {
            "name": "HDMI Cable 6ft",
            "description": "High-speed HDMI 2.1 cable supporting 4K@120Hz",
            "price": 16.99,
            "category": "Accessories",
            "stock": 140,
            "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"
        },
        {
            "name": "Ring Light 10 inch",
            "description": "LED ring light with tripod for photography and videos",
            "price": 44.99,
            "category": "Electronics",
            "stock": 65,
            "image_url": "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=500"
        },
        {
            "name": "Power Bank 20000mAh",
            "description": "High-capacity power bank with fast charging",
            "price": 49.99,
            "category": "Electronics",
            "stock": 85,
            "image_url": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500"
        },
        {
            "name": "Headphone Stand Wood",
            "description": "Premium wooden headphone stand with cable holder",
            "price": 35.99,
            "category": "Accessories",
            "stock": 75,
            "image_url": "https://images.unsplash.com/photo-1545539904-c9c1af326ff8?w=500"
        },
        {
            "name": "USB Flash Drive 128GB",
            "description": "High-speed USB 3.0 flash drive with metal casing",
            "price": 24.99,
            "category": "Storage",
            "stock": 160,
            "image_url": "https://images.unsplash.com/photo-1624823183493-ed5832f48f18?w=500"
        }
    ]

    print("Seeding products...")
    for product in products:
        ProductModel.create(**product)

    print(f"Successfully seeded {len(products)} products")


def seed_bots():
    """Seed sample bots for demonstration"""
    print("Seeding bots...")

    # Create demo user if not exists
    demo_user = UserModel.get_by_email("demo@example.com")
    if not demo_user:
        user_id = UserModel.create(
            email="demo@example.com",
            password="password123",
            full_name="Demo Bot Creator"
        )
    else:
        user_id = demo_user["id"]

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

    for bot in bots:
        bot_id = BotModel.create(**bot)
        if bot_id:
            print(f"  ✓ Created bot: {bot['name']}")

    print(f"Successfully seeded {len(bots)} bots")


if __name__ == "__main__":
    seed_products()
    seed_bots()