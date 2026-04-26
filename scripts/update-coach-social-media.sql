-- Update coaches with random social media links
-- Run this in psql or drizzle studio

-- First, let's see current state
-- SELECT id, name, facebook_url, instagram_url, website_url FROM coaches;

-- Random social media combinations for coaches
WITH social_combos AS (
  SELECT * FROM (VALUES
    (1, 'https://facebook.com/coach.swimming.hk', NULL, NULL),                           -- FB only
    (2, NULL, 'https://instagram.com/yoga_with_maggie', NULL),                         -- IG only  
    (3, NULL, NULL, 'https://coachchan.com'),                                          -- Website only
    (4, 'https://facebook.com/basketballcoachhk', 'https://instagram.com/hkbasketballcoach', NULL),  -- FB + IG
    (5, 'https://facebook.com/tenniscoach.hk', NULL, 'https://tenniscoachhk.com'),     -- FB + Website
    (6, NULL, 'https://instagram.com/pilateslife.hk', 'https://pilateshk.com'),        -- IG + Website
    (7, 'https://facebook.com/golfacademy.hk', 'https://instagram.com/golfpro.hk', 'https://golfacademy.hk'),  -- All 3
    (8, NULL, NULL, NULL),                                                             -- None
    (9, 'https://facebook.com/dancestudio.hk', NULL, NULL),                            -- FB only
    (10, NULL, 'https://instagram.com/swimcoach.david', NULL),                         -- IG only
    (11, NULL, NULL, 'https://boxinggym.com'),                                         -- Website only
    (12, 'https://facebook.com/tabletennishk', 'https://instagram.com/ttcoach.hk', NULL)  -- FB + IG
  ) AS t(idx, fb, ig, web)
)

-- Update each coach with a random combination
UPDATE coaches 
SET 
  facebook_url = combos.fb,
  instagram_url = combos.ig,
  website_url = combos.web
FROM (
  SELECT c.id, 
         sc.fb,
         sc.ig,
         sc.web
  FROM coaches c
  CROSS JOIN LATERAL (
    SELECT * FROM social_combos 
    WHERE idx = ((c.id - 1) % 12) + 1
  ) sc
) combos
WHERE coaches.id = combos.id;

-- Verify the update
SELECT id, name, facebook_url, instagram_url, website_url 
FROM coaches 
ORDER BY id 
LIMIT 10;
