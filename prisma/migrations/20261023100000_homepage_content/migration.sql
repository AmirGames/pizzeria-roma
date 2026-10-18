CREATE TABLE "HomePageContent" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "eyebrow" VARCHAR(80) NOT NULL DEFAULT 'PIZZERIA ROMA · NAMUR',
    "title" VARCHAR(180) NOT NULL DEFAULT 'De véritables saveurs italiennes à Namur',
    "intro" VARCHAR(500) NOT NULL DEFAULT 'Pizzas artisanales, pâtes, salades et bien plus encore. À emporter ou en livraison, toujours avec passion.',
    "primaryLabel" VARCHAR(60) NOT NULL DEFAULT 'Découvrir la carte',
    "secondaryLabel" VARCHAR(60) NOT NULL DEFAULT 'Voir la carte',
    "heroImage" VARCHAR(300) NOT NULL DEFAULT '/roma-hero.png',
    "aboutTitle" VARCHAR(180) NOT NULL DEFAULT 'Une histoire de famille, de passion et de tradition',
    "aboutTextOne" VARCHAR(500) NOT NULL DEFAULT 'Présente dans le Namurois depuis 2003, la Pizzeria Roma cultive une ambiance familiale et le goût des traditions culinaires italiennes.',
    "aboutTextTwo" VARCHAR(500) NOT NULL DEFAULT 'Livraison, plats à emporter et recettes préparées avec soin : découvrez l’histoire qui nous lie à nos clients depuis plus de vingt ans.',
    "metaTitle" VARCHAR(70) NOT NULL DEFAULT 'Pizza italienne à Namur depuis 2003',
    "metaDescription" VARCHAR(170) NOT NULL DEFAULT 'Découvrez les pizzas, pâtes et spécialités de Pizzeria Roma à Namur. À emporter ou en livraison.',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HomePageContent_pkey" PRIMARY KEY ("id")
);
