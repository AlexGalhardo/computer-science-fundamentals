# Results: embeddings-vector-search (Python)

Generated with `docker compose run --rm python-demo`. Every random choice has a fixed seed, so the tables are reproducible.

Corpus: `data/corpus.txt` (2400 generated sentences) plus the sentences of the 30 passages of `data/passages.json`: 2492 sentences, 760 distinct words. Each word vector has 760 numbers (one per word of the vocabulary).

## The nearest neighbours of one word of each group

| Word | Group | 5 nearest neighbours (cosine similarity) |
| --- | --- | --- |
| dog | animals | wolf 0.689, cat 0.674, cow 0.669, rabbit 0.640, deer 0.631 |
| bread | foods | stew 0.657, cake 0.611, rice 0.611, pasta 0.599, soup 0.577 |
| car | vehicles | ship 0.715, tram 0.667, van 0.653, truck 0.643, plane 0.624 |
| red | colours | purple 0.729, yellow 0.724, blue 0.716, black 0.707, pink 0.703 |
| rain | weather | thunder 0.793, sunshine 0.779, drizzle 0.749, hail 0.745, fog 0.650 |
| piano | instruments | harp 0.596, flute 0.561, organ 0.542, cello 0.532, trumpet 0.506 |
| laptop | devices | monitor 0.565, keyboard 0.550, server 0.549, tablet 0.531, phone 0.529 |
| doctor | professions | plumber 0.708, nurse 0.646, lawyer 0.643, engineer 0.625, teacher 0.619 |

## Do the neighbours fall in the expected group? (5 neighbours of each test word)

| Group | Test words | Neighbours in the group (PPMI) | Words with all 5 in the group | Neighbours in the group (raw counts) |
| --- | ---: | ---: | ---: | ---: |
| animals | 10 | 98.0% | 9 | 100.0% |
| foods | 10 | 100.0% | 10 | 100.0% |
| vehicles | 10 | 100.0% | 10 | 100.0% |
| colours | 10 | 100.0% | 10 | 100.0% |
| weather | 10 | 100.0% | 10 | 100.0% |
| instruments | 10 | 100.0% | 10 | 100.0% |
| devices | 10 | 100.0% | 10 | 100.0% |
| professions | 10 | 100.0% | 10 | 100.0% |
| **all** | 80 | 99.8% | 79 | 100.0% |

## Raw counts against PPMI

| Weighting | Mean cosine, same group | Mean cosine, different groups | Gap |
| --- | ---: | ---: | ---: |
| raw counts | 0.964 | 0.820 | 0.144 |
| PPMI | 0.650 | 0.031 | 0.619 |

## Brute force against the index

Indexed: the 1927 sentences of the corpus with distinct content words, one vector each. Queries: the 400 sentences of `data/queries.txt`, none of them in the corpus. One comparison = one dot product between two vectors of 760 numbers.

| Search | Tables | Bits | Probing | Same top result as brute force | Vectors compared (average) | Plane dot products | Total | Share of brute force |
| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: |
| brute force | - | - | - | 100.0% | 1927 | 0 | 1927 | 100.0% |
| index | 1 | 12 | no | 37.0% | 9.8 | 12 | 21.8 | 1.1% |
| index | 4 | 12 | no | 82.8% | 51.5 | 48 | 99.5 | 5.2% |
| index | 8 | 12 | no | 94.3% | 84.4 | 96 | 180.4 | 9.4% |
| index | 8 | 10 | no | 97.3% | 117.1 | 80 | 197.1 | 10.2% |
| index | 2 | 10 | 1 bit | 94.3% | 113.1 | 20 | 133.1 | 6.9% |
| **index (chosen)** | 4 | 12 | 1 bit | 98.5% | 172.5 | 48 | 220.5 | 11.4% |
| index | 8 | 12 | 1 bit | 100.0% | 250.1 | 96 | 346.1 | 18.0% |

## Retrieval: the passages each question picks

| Question | Expected | 1st | 2nd | 3rd |
| --- | --- | --- | --- | --- |
| Which animal guards the farm at night? | p01 | p01 The farm dog (0.666) | p08 Night trains (0.315) | p15 The first snow (0.282) |
| How do I bake a loaf of bread? | p04 | p04 Baking bread (0.554) | p05 A pot of soup (0.217) | p10 Mixing paint (0.208) |
| Which colours do I mix to get green? | p10 | p10 Mixing paint (0.569) | p04 Baking bread (0.348) | p05 A pot of soup (0.172) |
| Why is my computer so slow? | p19 | p19 A slow laptop (0.519) | p16 Learning the piano (0.217) | p07 The morning bus (0.124) |
| What happens when thunder and rain arrive? | p13 | p13 A summer storm (0.594) | p14 Morning fog (0.281) | p15 The first snow (0.266) |
| How do musicians tune the strings of a guitar? | p18 | p18 Tuning a guitar (0.702) | p16 Learning the piano (0.314) | p17 The street band (0.197) |
| Who checks each patient in the hospital at night? | p22 | p22 The night nurse (0.558) | p03 Sheep in the hills (0.239) | p18 Tuning a guitar (0.142) |
| What do bees make from flowers? | p26 | p26 Bees and honey (0.611) | p27 Why we sleep (0.221) | p05 A pot of soup (0.121) |
| Why do leaves turn red in autumn? | p11 | p11 Autumn leaves (0.839) | p07 The morning bus (0.274) | p02 Foxes at dusk (0.225) |
| Is the wolf a danger to the flock? | p03 | p03 Sheep in the hills (0.556) | p01 The farm dog (0.209) | p20 The office printer (0.173) |
| Will drizzle or hail come tomorrow? | p13, p14 or p15 | p13 A summer storm (0.558) | p14 Morning fog (0.382) | p15 The first snow (0.361) |
| Why does the sea rise and fall? | p25 | p17 The street band (0.346) | p25 Tides (0.272) | p04 Baking bread (0.255) |

## The output of the search command

```text
question: "Which animal guards the farm at night?"
words used: guards farm night
not in the vocabulary: animal
compared with 30 passages by brute force

1. score 0.666  p01  The farm dog
   A farm dog sleeps lightly beside the barn. At night it guards the yard and barks when a fox comes near the hens. In the morning the farmer rewards it with a bone.
2. score 0.315  p08  Night trains
   A night train crosses the country while its passengers sleep in narrow beds. It stops at small stations in the dark, and the engine is changed at the border before sunrise.
3. score 0.282  p15  The first snow
   The first snow of winter usually falls at night and melts by noon. Real cold comes later, when frost hardens the ground and the snow stays on the hills for weeks.
```

A question with no content word in common with the passages it finds:

```text
question: "Will drizzle or hail come tomorrow?"
words used: drizzle hail
not in the vocabulary: come tomorrow
compared with 30 passages by brute force

1. score 0.558  p13  A summer storm
   A summer storm builds during a hot afternoon. Dark clouds pile up, the wind turns cold, and then thunder, lightning and heavy rain arrive together. Half an hour later the sky is clear again.
2. score 0.382  p14  Morning fog
   Fog forms in the valley when damp air cools during a calm night. By morning the river and the fields are hidden, and the fog lifts only when the sun warms the ground.
3. score 0.361  p15  The first snow
   The first snow of winter usually falls at night and melts by noon. Real cold comes later, when frost hardens the ground and the snow stays on the hills for weeks.
```

A question it gets wrong:

```text
question: "Why does the sea rise and fall?"
words used: sea rise fall
not in the vocabulary: (none)
compared with 30 passages by brute force

1. score 0.346  p17  The street band
   On Saturdays a small band plays in the square: a trumpet, a drum and an old banjo. People stop to listen, children dance, and coins fall into the open guitar case.
2. score 0.272  p25  Tides
   The sea rises and falls twice a day because the moon pulls on the water. At low tide the beach grows wide and the boats in the harbour rest on the sand.
3. score 0.255  p04  Baking bread
   To bake bread you mix flour, water, salt and yeast, then let the dough rise for an hour. The loaf goes into a hot oven until the crust turns golden and sounds hollow when tapped.
```
