"""Production whitelist for resolving TheMealDB names to the 110-item catalogue.

Tier 1 covers names/preparation forms of the same ingredient. Tier 2 covers
explicitly reviewed varieties, cuts and form factors. Runtime matching is
deterministic: no substring, edit-distance or implicit fallback is allowed.
"""

from __future__ import annotations

import re
import unicodedata
from collections import defaultdict


_RAW_SOURCES_BY_TARGET: defaultdict[str, list[str]] = defaultdict(list)


def normalize_ingredient_name(name: str) -> str:
    value = unicodedata.normalize("NFKD", name.casefold())
    value = "".join(character for character in value if not unicodedata.combining(character))
    return re.sub(r"\s+", " ", re.sub(r"[-_,]", " ", value)).strip()


def _groups(rows: list[tuple[str, str]]) -> dict[str, tuple[str, ...]]:
    result: dict[str, tuple[str, ...]] = {}
    for targets, sources in rows:
        target_ids = tuple(targets.split("+"))
        for source in sources.split("|"):
            key = normalize_ingredient_name(source)
            if key in result:
                raise ValueError(f"Duplicate ingredient mapping: {source}")
            result[key] = target_ids
            if len(target_ids) == 1:
                _RAW_SOURCES_BY_TARGET[target_ids[0]].append(source)
    return result


FIRST_TIER_MAPPINGS = _groups([
    ("water", "boiling water|cold water|warm water|ice cubes"),
    ("lemon", "lemons|lemon juice|lemon zest|unwaxed lemon"),
    ("lime", "limes|lime juice|unwaxed lime"),
    ("egg", "egg white|egg whites|egg yolk|egg yolks|egg wash|free-range egg, beaten|free-range eggs, beaten"),
    ("butter", "melted butter|chilled butter"),
    ("flour", "all purpose flour|wheat flour|white flour"),
    ("sugar", "granulated sugar|ground sugar|powdered sugar|icing sugar"),
    ("garlic", "garlic cloves|garlic bulb|minced garlic|crushed garlic"),
    ("garlic-granules", "garlic powder"),
    ("onion", "chopped onion|ground onion"),
    ("eggplant", "egg plants|aubergines|eggplants"),
    ("zucchini", "courgettes|zucchinis"),
    ("spring-onion", "scallions|scallion"),
    ("canned-tomatoes", "tinned tomatos|tinned tomatoes|chopped tomatoes|diced tomatoes"),
    ("tomato-puree", "tomato purée"),
    ("chicken-breast", "chicken breasts"),
    ("minced-beef", "lean minced beef|lean minced steak"),
    ("prawns", "raw frozen prawns"),
    ("ginger", "ginger paste|ground ginger"),
    ("ginger+garlic", "ginger garlic paste"),
    ("feta", "cubed feta cheese"),
    ("mozzarella", "mozzarella balls"),
    ("parmesan", "parmesan cheese|parmigiano-reggiano"),
    ("chickpeas", "can of chickpeas"),
    ("basil", "fresh basil"),
    ("parsley", "chopped parsley|freshly chopped parsley"),
    ("thyme", "fresh thyme"),
    ("oregano", "dried oregano"),
    ("black-pepper", "ground black pepper|peppercorns|whole black peppercorns"),
    ("cumin", "ground cumin|cumin seeds"),
    ("cinnamon", "ground cinnamon|cinnamon stick"),
    ("ground-coriander", "coriander seeds"),
    ("turmeric", "ground turmeric|turmeric powder"),
    ("chilli-flakes", "red chilli flakes|pul biber"),
    ("mustard", "ground mustard|mustard powder|mustard seeds"),
    ("vanilla-extract", "vanilla|vanilla bean paste|vanilla pod|vanilla powder"),
    ("sugar+vanilla-extract", "vanilla sugar"),
    ("cornstarch", "corn flour"),
    ("peas", "frozen peas"),
    ("almonds", "flaked almonds|ground almonds|almond flour"),
    ("walnuts", "ground walnuts"),
    ("oats", "ground oats|oatmeal|porridge oats|rolled oats"),
    ("bread", "stale bread|toast"),
    ("potatoes", "fries"),
    ("chicken-stock", "chicken stock cube|chicken bouillon powder"),
    ("vegetable-stock-cube", "vegetable stock"),
    ("yeast", "instant yeast|fast action yeast"),
    ("yogurt", "natural yoghurt"),
    ("honey", "clear honey"),
])


SECOND_TIER_MAPPINGS = _groups([
    ("tomato", "baby plum tomatoes|beef tomatoes|cherry tomatoes|grape tomatoes|plum tomatoes|vine tomatoes|sun-dried tomatoes"),
    ("onion", "red onions|shallots|challots"),
    ("bell-pepper", "yellow pepper|mixed peppers|romano pepper|sweet red peppers|roasted pepper"),
    ("chilli", "red chilli|green chilli|dried chillies|dried red chillies|birds-eye chillies|ancho chillies|habanero pepper|jalapeno|scotch bonnet|padron peppers|banana pepper|sweet peppadew peppers"),
    ("chilli-flakes", "chilli powder|chili powder|red chilli powder|hot chilli powder|cayenne pepper"),
    ("paprika", "smoked paprika|smoky paprika|hot smoked paprika|sweet smoked paprika"),
    ("potatoes", "baby new potatoes|charlotte potatoes|floury potatoes|jersey royal potatoes|new potatoes|red potatoes|russet potato|small potatoes"),
    ("eggplant", "baby aubergine"),
    ("apple", "braeburn apples|bramley apples|cooking apples"),
    ("banana", "cocoy banana|fried ripe bananas"),
    ("cabbage", "cabbage leaves|chinese cabbage|chinese leaf|hispi (sweetheart) cabbage|napa cabbage|red cabbage|savoy cabbage|white cabbage|bok choi|pak choi|baby pak koi"),
    ("lettuce", "baby lettuce leaves|iceberg lettuce|little gem lettuce"),
    ("broccoli", "chinese broccoli|purple sprouting broccoli"),
    ("green-beans", "chinese long beans|runner beans"),
    ("mushrooms", "chestnut mushroom|oyster mushrooms|shiitake mushrooms|wild mushrooms|wood ear mushrooms"),
    ("peas", "petit pois|snow peas|sugar snap peas"),
    ("chicken-breast", "chicken|chicken drumsticks|chicken legs|chicken thighs|chicken wings"),
    ("beef", "beef brisket|beef cutlet|beef fillet|beef flank steak|beef shin|beef tenderloin|chuck roast|feather blade beef|fillet of steak|flank steak|mixed beef cuts|sirloin steak|sirloin steak tips|skirty steak|oxtail"),
    ("pork", "ground pork|minced pork|pork back ribs|pork belly slices|pork chops|pork knuckle|pork shoulder|pork shoulder steaks|pork tenderloin"),
    ("lamb", "lamb leg|lamb loin chops|lamb mince|lamb shanks|lamb shoulder"),
    ("bacon", "bacon lardon|streaky bacon"),
    ("ham", "deli ham|jamón ibérico|parma ham|prosciutto|serrano ham|smoked ham"),
    ("sausages", "german sausages|italian fennel sausages|kabanos sausages|kielbasa|polish kabanos|sour pork sausage"),
    ("prawns", "dried shrimp|jumbo shrimp|king prawns|raw king prawns|raw tiger prawns|tiger prawns"),
    ("cod", "codfish bulljaw|fish fillet|white fish|white fish fillets|haddock|hake|monkfish|barramundi|sea bass fillets|red snapper"),
    ("salmon", "rainbow trout|trout"),
    ("cheese", "cheddar cheese|colby jack cheese|emmentaler cheese|gouda cheese|gruyere|gruyere cheese|manchego|mature cheddar|monterey jack cheese|panquehue cheese|shredded mexican cheese|shredded monterey jack cheese|swiss cheese|västerbottensost cheese|liquid cheese"),
    ("parmesan", "pecorino"),
    ("yogurt", "full fat yogurt|greek yogurt|strained yoghurt"),
    ("milk", "semi-skimmed milk|whole milk"),
    ("cream", "clotted cream|double cream|heavy cream|single cream|whipping cream|malai"),
    ("butter", "salted butter|unsalted butter|ghee"),
    ("bread", "baguette|bread rolls|bun|buns|ciabatta|crusty bread|cuban bread|english muffins|naan bread|pita bread|rye bread|sesame seed burger buns|white bread|wholegrain bread"),
    ("flour", "bread flour|strong white bread flour|strong white flour|strong wholemeal flour"),
    ("rice", "basmati rice|brown rice|dessert rice|glutinous rice|jasmine rice|paella rice|sushi rice"),
    ("spaghetti", "bowtie pasta|farfalle|fettuccine|linguine pasta|macaroni|paccheri pasta|penne rigate|rigatoni|vermicelli pasta|lasagne sheets"),
    ("noodles", "egg noodles|udon noodles|sevaiiya"),
    ("rice-noodles", "brown rice noodle|flat rice noodles|rice stick noodles|rice vermicelli|vermicelli rice noodles"),
    ("kidney-beans", "black beans|black eyed peas|borlotti beans|broad beans|butter beans|canned beans|cannellini beans|dried white beans|dried white navy beans|great northern beans|haricot beans|lima beans|pinto beans"),
    ("lentils", "brown lentils|french lentils|green red lentils|toor dal"),
    ("peas", "yellow split peas"),
    ("tortillas", "corn tortillas|flour tortilla|hard taco shells"),
    ("tofu", "marinated tofu|silken tofu"),
    ("chocolate", "chocolate chips|dark chocolate|dark chocolate chips|milk chocolate|plain chocolate|white chocolate|white chocolate chips"),
    ("raisins", "currants|light raisins|sultanas"),
    ("jam", "apricot jam|blackcurrant jam|plum jam|raspberry jam|sorrel jam"),
    ("vegetable-oil", "canola oil|coconut oil|ground nut oil|high heat cooking oil|peanut oil|rapeseed oil|sunflower oil"),
    ("olive-oil", "truffle oil"),
    ("vinegar", "apple cider vinegar|balsamic vinegar|cider vinegar|malt vinegar|red wine vinegar|rice vinegar|seasoned rice vinegar|sherry vinegar|vegan white wine vinegar|white vinegar|white wine vinegar"),
    ("soy-sauce", "dark soy sauce"),
    ("mustard", "dijon mustard|english mustard|wholegrain mustard"),
    ("chilli-sauce", "hotsauce|sriracha|sweet chilli sauce|tabasco sauce|tobasco sauce"),
    ("salt", "coarse salt|kosher salt|sea salt"),
    ("black-pepper", "kampot pepper"),
    ("sugar", "caster sugar|golden caster sugar|brown sugar|dark brown soft sugar|dark brown sugar|dark soft brown sugar|demerara sugar|light brown soft sugar|muscovado sugar|palm sugar|coco sugar"),
    ("coconut-milk", "unsweetened coconut milk|coconut cream"),
    ("curry-powder", "jamaican curry powder"),
])


def relaxed_mapping(name: str) -> tuple[tuple[str, ...], str] | None:
    key = normalize_ingredient_name(name)
    if key in FIRST_TIER_MAPPINGS:
        return FIRST_TIER_MAPPINGS[key], "alias"
    if key in SECOND_TIER_MAPPINGS:
        return SECOND_TIER_MAPPINGS[key], "family"
    return None


def source_names_by_target() -> dict[str, tuple[str, ...]]:
    """Reverse whitelist used to broaden Recipe Radar candidate discovery."""
    return {target: tuple(names) for target, names in _RAW_SOURCES_BY_TARGET.items()}


REVERSE_SOURCE_NAMES = source_names_by_target()

