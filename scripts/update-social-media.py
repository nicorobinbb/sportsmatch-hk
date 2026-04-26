#!/usr/bin/env python3
"""
Script to update coach social media links with random combinations
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import ssl

DATABASE_URL = "postgresql://postgres.vosbykmmrfcyrdrkvinx:Felixisagenius!@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Random social media combinations
social_combos = [
    {"fb": "https://facebook.com/coach.swimming.hk", "ig": None, "web": None},
    {"fb": None, "ig": "https://instagram.com/yoga_with_maggie", "web": None},
    {"fb": None, "ig": None, "web": "https://coachchan.com"},
    {"fb": "https://facebook.com/basketballcoachhk", "ig": "https://instagram.com/hkbasketballcoach", "web": None},
    {"fb": "https://facebook.com/tenniscoach.hk", "ig": None, "web": "https://tenniscoachhk.com"},
    {"fb": None, "ig": "https://instagram.com/pilateslife.hk", "web": "https://pilateshk.com"},
    {"fb": "https://facebook.com/golfacademy.hk", "ig": "https://instagram.com/golfpro.hk", "web": "https://golfacademy.hk"},
    {"fb": None, "ig": None, "web": None},  # None
    {"fb": "https://facebook.com/dancestudio.hk", "ig": None, "web": None},
    {"fb": None, "ig": "https://instagram.com/swimcoach.david", "web": None},
    {"fb": None, "ig": None, "web": "https://boxinggym.com"},
    {"fb": "https://facebook.com/tabletennishk", "ig": "https://instagram.com/ttcoach.hk", "web": None},
    {"fb": "https://facebook.com/taekwondohk", "ig": "https://instagram.com/tkdmaster.hk", "web": "https://tkdacademy.hk"},
    {"fb": "https://facebook.com/gymnasticshk", "ig": None, "web": None},
    {"fb": None, "ig": "https://instagram.com/fencingcoach.hk", "web": "https://fencingpro.com"},
    {"fb": "https://facebook.com/volleyballhk", "ig": "https://instagram.com/vbcoach.hk", "web": None},
    {"fb": None, "ig": None, "web": "https://runnersclub.hk"},
    {"fb": "https://facebook.com/danceacademy.hk", "ig": "https://instagram.com/dancepro.hk", "web": "https://dancestudio.hk"},
    {"fb": "https://facebook.com/fitnesshk", "ig": None, "web": "https://personaltrainer.hk"},
    {"fb": None, "ig": "https://instagram.com/badmintoncoach", "web": None},
]

def update_coach_social_media():
    print("🔄 Updating coach social media links...\n")
    
    # Create SSL context that doesn't verify certificates (needed for Supabase)
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    conn = None
    try:
        # Connect to database
        conn = psycopg2.connect(
            DATABASE_URL,
            sslmode='require',
            sslrootcert=None
        )
        
        print("✅ Connected to database\n")
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get all coaches
        cursor.execute("SELECT id, name FROM coaches ORDER BY id")
        coaches = cursor.fetchall()
        
        print(f"Found {len(coaches)} coaches to update\n")
        
        stats = {"fb": 0, "ig": 0, "web": 0, "none": 0}
        
        for i, coach in enumerate(coaches):
            combo = social_combos[i % len(social_combos)]
            
            cursor.execute(
                """
                UPDATE coaches 
                SET facebook_url = %s, instagram_url = %s, website_url = %s 
                WHERE id = %s
                """,
                (combo["fb"], combo["ig"], combo["web"], coach["id"])
            )
            
            # Stats
            has_any = combo["fb"] or combo["ig"] or combo["web"]
            if not has_any:
                stats["none"] += 1
            if combo["fb"]:
                stats["fb"] += 1
            if combo["ig"]:
                stats["ig"] += 1
            if combo["web"]:
                stats["web"] += 1
            
            social_text = []
            if combo["fb"]:
                social_text.append("FB")
            if combo["ig"]:
                social_text.append("IG")
            if combo["web"]:
                social_text.append("Web")
            if not social_text:
                social_text.append("(none)")
            
            print(f"✅ {coach['name']}: {' '.join(social_text)}")
        
        # Commit changes
        conn.commit()
        
        print("\n📊 Summary:")
        print(f"   Facebook: {stats['fb']} coaches")
        print(f"   Instagram: {stats['ig']} coaches")
        print(f"   Website: {stats['web']} coaches")
        print(f"   No social: {stats['none']} coaches")
        print("\n✨ Done! Refresh localhost:5173 to see the changes.")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        if conn:
            conn.rollback()
        raise
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    try:
        update_coach_social_media()
    except Exception as e:
        print(f"\n❌ Script failed: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
