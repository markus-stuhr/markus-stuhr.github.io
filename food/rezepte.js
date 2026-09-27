// Rezepte aus dem Vault (MD Vault/Rezepte), strukturiert fuer rezepte/index.html.
// Pro Abschnitt: Zutaten als [Menge, Zutat], Schritte als {t: Titel, x: Text, z: Zeit}.
window.REZEPTE = [
  {
    id: 'pilzsahne', titel: 'Nudeln mit Pilzsahnesauce', kategorie: 'Deutsch', emoji: '🍄‍🟫',
    farbe: ['#8a6a4a', '#d9b98a'], portionen: '4 Portionen', zeit: '30 Min.',
    teaser: 'Goldbraun angebratene Champignons in cremiger Sahnesauce – das vegetarische Feierabend-Essen, das die ganze Familie mag.',
    tags: ['vegetarisch', 'Familie'],
    abschnitte: [{
      zutaten: [['400 g', 'Nudeln (z.B. Tagliatelle oder Penne)'], ['500 g', 'Braune Champignons'], ['2', 'Zwiebeln'], ['200 ml', 'Sahne'], ['150 ml', 'Gemüsebrühe'], ['2–3', 'Knoblauchzehen'], ['2 EL', 'Olivenöl oder Butter'], ['', 'Salz & Pfeffer'], ['', 'Parmesan, frisch gerieben']],
      schritte: [
        { t: 'Champignons vorbereiten', x: 'Champignons putzen und in Scheiben schneiden. Zwiebeln fein würfeln.' },
        { t: 'Zwiebeln andünsten', x: 'Öl oder Butter in einer großen Pfanne erhitzen, Zwiebeln bei mittlerer Hitze glasig dünsten. Knoblauch fein hacken und kurz mitdünsten.', z: '3–4 Min.' },
        { t: 'Pilze anbraten', x: 'Champignons dazugeben und bei hoher Hitze anbraten, bis sie goldbraun sind.', z: '5–7 Min.' },
        { t: 'Sauce kochen', x: 'Gemüsebrühe angießen, kurz einköcheln lassen, dann Sahne dazugeben. Mit Salz und Pfeffer kräftig abschmecken und köcheln lassen, bis die Sauce leicht eindickt.', z: '5 Min.' },
        { t: 'Pasta kochen', x: 'Nudeln parallel in reichlich gesalzenem Wasser al dente kochen.' },
        { t: 'Servieren', x: 'Nudeln abgießen, auf Tellern anrichten, Sauce darüber geben. Parmesan frisch darüber reiben.' }
      ]
    }]
  },
  {
    id: 'kartoffelquark', titel: 'Kartoffeln mit Quark', kategorie: 'Deutsch', bild: 'img/kartoffeln.svg', emoji: '🥔',
    farbe: ['#6d7a2a', '#d8d48a'], portionen: '4 Portionen', zeit: '30 Min.',
    teaser: 'Pellkartoffeln mit frischem Kräuterquark und einem Schuss Leinöl – der schnelle Klassiker, der einfach immer geht.',
    tags: ['vegetarisch', 'Familie', 'Klassiker'],
    abschnitte: [
      { titel: 'Pellkartoffeln', zutaten: [['1 kg', 'Kartoffeln, festkochend'], ['1 TL', 'Kümmel (optional)'], ['', 'Salz']],
        schritte: [
          { t: 'Kartoffeln kochen', x: 'Kartoffeln gründlich waschen und mit Schale in einem Topf mit Salzwasser (und nach Wunsch Kümmel) aufsetzen. Zugedeckt garen, bis ein Messer leicht hineingleitet.', z: '20–25 Min.' },
          { t: 'Abgießen', x: 'Abgießen und kurz ausdampfen lassen. Nach Wunsch pellen oder mit Schale servieren.' }
        ] },
      { titel: 'Kräuterquark', zutaten: [['500 g', 'Quark (20 oder 40 % Fett)'], ['100 ml', 'Milch'], ['1 Bund', 'Schnittlauch'], ['½ Bund', 'Petersilie'], ['1', 'Knoblauchzehe (optional)'], ['1 TL', 'Zitronensaft'], ['', 'Salz & Pfeffer'], ['2 EL', 'Leinöl zum Beträufeln']],
        schritte: [
          { t: 'Quark rühren', x: 'Quark mit Milch glatt und cremig rühren.' },
          { t: 'Kräuter hacken', x: 'Schnittlauch in feine Röllchen schneiden, Petersilie hacken, Knoblauch fein reiben.' },
          { t: 'Abschmecken', x: 'Kräuter und Knoblauch unterrühren, mit Zitronensaft, Salz und Pfeffer abschmecken.' },
          { t: 'Servieren', x: 'Kartoffeln mit einem großen Klecks Quark anrichten, Leinöl darüberträufeln.' }
        ] }
    ],
    tipps: ['Leinöl ist der norddeutsche Klassiker dazu – sparsam verwenden, es schmeckt kräftig.', 'Dazu passen Gurkensalat oder ein paar Radieschen.', 'Übrige Kartoffeln am nächsten Tag als Bratkartoffeln.']
  },
  {
    id: 'schinkennudeln', titel: 'Schinken-Käse-Nudeln', kategorie: 'Deutsch', bild: 'img/schinkennudeln.svg', emoji: '🧀',
    farbe: ['#a8641c', '#f5cf6a'], portionen: '4 Portionen', zeit: '45 Min.',
    teaser: 'Nudeln und Kochschinken in der Auflaufform, mit Ei-Sahne übergossen und unter einer goldbraunen Käsekruste überbacken.',
    tags: ['Familie', 'Ofen', 'Klassiker'],
    abschnitte: [{
      zutaten: [['400 g', 'Nudeln (z.B. Penne oder Hörnchen)'], ['200 g', 'Kochschinken, gewürfelt'], ['1', 'Zwiebel'], ['1 TL', 'Butter'], ['3', 'Eier'], ['200 ml', 'Sahne'], ['100 ml', 'Milch'], ['200 g', 'Geriebener Käse (Gouda oder Emmentaler)'], ['', 'Salz, Pfeffer, Muskat'], ['', 'Schnittlauch zum Bestreuen']],
      schritte: [
        { t: 'Ofen vorheizen', x: 'Ofen auf 200 °C Ober-/Unterhitze vorheizen, Auflaufform fetten.' },
        { t: 'Nudeln kochen', x: 'Nudeln in Salzwasser knapp al dente kochen – sie garen im Ofen weiter – und abgießen.', z: '8 Min.' },
        { t: 'Schinken anbraten', x: 'Zwiebel fein würfeln und mit dem Schinken in Butter kurz anbraten.', z: '3 Min.' },
        { t: 'Ei-Sahne verquirlen', x: 'Eier, Sahne und Milch verquirlen, kräftig mit Salz, Pfeffer und Muskat würzen und die Hälfte des Käses unterrühren.' },
        { t: 'Form füllen', x: 'Nudeln mit Schinken und Zwiebeln mischen, in die Form geben und gleichmäßig mit der Ei-Sahne übergießen. Restlichen Käse darüberstreuen.' },
        { t: 'Überbacken', x: 'Im Ofen backen, bis die Ei-Sahne gestockt und der Käse goldbraun ist.', z: '20–25 Min.' },
        { t: 'Servieren', x: 'Kurz ruhen lassen und mit Schnittlauch bestreut servieren.' }
      ]
    }],
    tipps: ['Die Nudeln lieber etwas zu fest kochen, sonst werden sie im Ofen weich.', 'Ein paar Erbsen oder Brokkoli passen gut mit hinein.', 'Klassische Resteverwertung – funktioniert auch mit gekochten Nudeln vom Vortag.']
  },
  {
    id: 'parmesannudeln', titel: 'Nudeln mit Parmesansauce', kategorie: 'Italienisch', bild: 'img/parmesan.svg', emoji: '🍝',
    farbe: ['#8f7a3a', '#efdf9e'], portionen: '4 Portionen', zeit: '20 Min.',
    teaser: 'Butter, Sahne, viel frisch geriebener Parmesan und etwas Nudelwasser – in 20 Minuten eine seidige Sauce, die sich an jede Nudel schmiegt.',
    tags: ['vegetarisch', 'Familie', 'schnell'],
    abschnitte: [{
      zutaten: [['400 g', 'Nudeln (z.B. Tagliatelle oder Spaghetti)'], ['30 g', 'Butter'], ['1', 'Knoblauchzehe (optional)'], ['200 ml', 'Sahne'], ['100 g', 'Parmesan, frisch gerieben'], ['1 Tasse', 'Nudelwasser'], ['', 'Salz, Pfeffer, Muskat'], ['', 'Petersilie oder Basilikum']],
      schritte: [
        { t: 'Pasta kochen', x: 'Nudeln in reichlich Salzwasser al dente kochen. Vor dem Abgießen eine Tasse Nudelwasser abschöpfen.', z: '10 Min.' },
        { t: 'Butter schmelzen', x: 'Butter in einer großen Pfanne schmelzen, Knoblauch fein reiben und kurz darin andünsten – nicht bräunen.', z: '1 Min.' },
        { t: 'Sauce köcheln', x: 'Sahne angießen und leicht einköcheln lassen.', z: '3 Min.' },
        { t: 'Parmesan einrühren', x: 'Pfanne vom Herd nehmen und den Parmesan nach und nach einrühren, bis die Sauce cremig ist. Mit Pfeffer und etwas Muskat abschmecken.' },
        { t: 'Vermengen', x: 'Nudeln in die Sauce geben und schwenken. Mit einem Schuss Nudelwasser auf die gewünschte Cremigkeit bringen.' },
        { t: 'Servieren', x: 'Sofort servieren, mit extra Parmesan, frischem Pfeffer und Kräutern bestreuen.' }
      ]
    }],
    tipps: ['Parmesan nicht kochen lassen – sonst wird er fädig. Immer neben dem Herd einrühren.', 'Das stärkehaltige Nudelwasser macht die Sauce glatt und bindet sie.', 'Parmesan am Stück kaufen und frisch reiben, fertig geriebener schmilzt schlechter.']
  },
  {
    id: 'koefte', titel: 'Köfte & Halloumi mit Reis, Hummus und Saucen', kategorie: 'Türkisch', bild: 'img/koefte.svg', emoji: '🧆',
    farbe: ['#7a3a1a', '#e8b27a'], portionen: '4 Portionen', zeit: '1 Std.',
    teaser: 'Der große Grillteller für zuhause: würzige Köfte, gegrillter Halloumi, Butterreis, cremiger Hummus – dazu Knoblauch-Joghurt und eine scharfe Tomatensauce.',
    tags: ['Familie', 'Grillen', 'Wochenende'],
    abschnitte: [
      { titel: 'Köfte', zutaten: [['500 g', 'Rinder- oder Lammhack'], ['1', 'Zwiebel, fein gerieben'], ['2', 'Knoblauchzehen'], ['½ Bund', 'Glatte Petersilie'], ['2 EL', 'Semmelbrösel'], ['1 TL', 'Kreuzkümmel'], ['1 TL', 'Paprikapulver edelsüß'], ['½ TL', 'Pul Biber'], ['1 TL', 'Salz'], ['', 'Pfeffer']],
        schritte: [
          { t: 'Masse kneten', x: 'Zwiebel reiben und gut ausdrücken, Knoblauch reiben, Petersilie fein hacken. Mit Hack, Semmelbröseln und Gewürzen kräftig verkneten.' },
          { t: 'Formen', x: 'Mit nassen Händen 12 längliche Köfte formen, leicht flach drücken und kalt stellen.', z: '15 Min.' },
          { t: 'Braten', x: 'In der Grillpfanne oder auf dem Grill bei starker Hitze rundherum braten.', z: '8–10 Min.' }
        ] },
      { titel: 'Halloumi', zutaten: [['2 Pck. (à 225 g)', 'Halloumi'], ['1 EL', 'Olivenöl'], ['', 'Getrocknete Minze oder Oregano']],
        schritte: [
          { t: 'Halloumi grillen', x: 'In fingerdicke Scheiben schneiden, mit Öl bestreichen und in der heißen Grillpfanne goldbraun mit Grillstreifen braten. Mit Minze bestreuen.', z: '2 Min./Seite' }
        ] },
      { titel: 'Reis', zutaten: [['300 g', 'Langkornreis'], ['1 EL', 'Butter'], ['50 g', 'Fadennudeln (Şehriye, optional)'], ['600 ml', 'Heißes Wasser oder Brühe'], ['1 TL', 'Salz']],
        schritte: [
          { t: 'Reis kochen', x: 'Reis waschen. Butter im Topf schmelzen, Fadennudeln goldbraun rösten, Reis kurz mitdünsten. Mit heißem Wasser und Salz aufgießen, zugedeckt bei kleiner Hitze garen und danach 10 Minuten ruhen lassen.', z: '20 Min.' }
        ] },
      { titel: 'Hummus', zutaten: [['1 Dose (400 g)', 'Kichererbsen'], ['3 EL', 'Tahini'], ['1', 'Zitrone (Saft)'], ['1', 'Knoblauchzehe'], ['3 EL', 'Eiswasser'], ['2 EL', 'Olivenöl'], ['', 'Salz, Kreuzkümmel, Paprikapulver']],
        schritte: [
          { t: 'Pürieren', x: 'Kichererbsen abgießen und mit Tahini, Zitronensaft, Knoblauch und Salz im Mixer pürieren. Nach und nach Eiswasser zugeben, bis der Hummus luftig-cremig ist.', z: '3 Min.' },
          { t: 'Anrichten', x: 'Mit einer Mulde auf einen Teller streichen, Olivenöl hineingießen und mit Paprika und Kreuzkümmel bestäuben.' }
        ] },
      { titel: 'Saucen', zutaten: [['300 g', 'Griechischer Joghurt'], ['1', 'Knoblauchzehe'], ['1 TL', 'Getrocknete Minze'], ['2 EL', 'Tomatenmark'], ['1', 'Tomate'], ['1', 'Rote Spitzpaprika'], ['1 TL', 'Pul Biber'], ['1 EL', 'Zitronensaft'], ['', 'Salz, Olivenöl']],
        schritte: [
          { t: 'Knoblauch-Joghurt', x: 'Joghurt mit geriebenem Knoblauch, Minze und Salz glatt rühren.' },
          { t: 'Scharfe Sauce', x: 'Tomate und Paprika sehr fein würfeln oder kurz pürieren, mit Tomatenmark, Pul Biber, Zitronensaft, Olivenöl und Salz verrühren.' },
          { t: 'Servieren', x: 'Reis, Köfte, Halloumi und Hummus auf großen Tellern anrichten, Saucen in Schälchen dazu. Dazu passen Fladenbrot, Tomaten, Gurken und Zwiebeln mit Sumach.' }
        ] }
    ],
    tipps: ['Hummus und Saucen lassen sich schon am Vortag machen – dann bleibt am Tag nur Braten und Reis.', 'Die geriebene Zwiebel gut ausdrücken, sonst fallen die Köfte auseinander.', 'Halloumi erst ganz zum Schluss braten, er wird beim Abkühlen gummiartig.']
  },
  {
    id: 'tamagoyaki', titel: 'Japanisches Omelett (Tamagoyaki)', kategorie: 'Japanisch', bild: 'img/tamagoyaki.svg', emoji: '🍳',
    farbe: ['#b8860b', '#f9e27a'], portionen: '2 Portionen', zeit: '15 Min.',
    teaser: 'Nur Eier, Salz und Pfeffer – in der eckigen Pfanne Schicht für Schicht aufgerollt und gefaltet, bis ein saftiger, gelber Block mit feinen Lagen entsteht.',
    tags: ['vegetarisch', 'schnell', 'Frühstück'],
    abschnitte: [{
      zutaten: [['4', 'Eier'], ['1 Prise', 'Salz'], ['', 'Pfeffer'], ['1 TL', 'Pflanzenöl für die Pfanne']],
      schritte: [
        { t: 'Eier verquirlen', x: 'Eier mit Salz und Pfeffer gründlich verquirlen, aber nicht schaumig schlagen. Wer es ganz glatt mag, gießt sie durch ein Sieb.' },
        { t: 'Pfanne einölen', x: 'Die eckige Omelettpfanne bei mittlerer Hitze erhitzen und mit einem in Öl getauchten Küchenpapier dünn auswischen.' },
        { t: 'Erste Schicht', x: 'Etwa ein Viertel der Eimasse hineingießen und durch Schwenken dünn verteilen. Blasen mit Stäbchen anstechen.', z: '1 Min.' },
        { t: 'Aufrollen', x: 'Sobald die Oberfläche fast gestockt, aber noch feucht ist, das Omelett von der hinteren Kante in 3–4 Faltungen zu sich nach vorne rollen.' },
        { t: 'Nächste Schicht', x: 'Rolle wieder nach hinten schieben, Pfanne erneut einölen, die nächste Portion Ei eingießen und dabei die Rolle kurz anheben, damit Ei darunterläuft. Wieder zusammenrollen – so oft wiederholen, bis die Masse aufgebraucht ist.' },
        { t: 'In Form drücken', x: 'Die fertige Rolle in der Pfanne an den Rand drücken, damit sie eckig wird, oder in einer Bambusmatte kurz in Form bringen.', z: '1 Min.' },
        { t: 'Aufschneiden', x: 'Etwas abkühlen lassen und in daumendicke Scheiben schneiden, sodass die Schichten sichtbar werden.' }
      ]
    }],
    tipps: ['Hitze lieber etwas niedriger – das Omelett soll gelb bleiben und keine braunen Stellen bekommen.', 'Nicht warten, bis eine Schicht ganz fest ist: leicht feucht klebt sie besser an der nächsten.', 'Ohne eckige Pfanne geht es auch in einer kleinen runden – dann die Seiten vor dem Rollen einklappen.']
  },
  {
    id: "falafel",
    titel: "Falafel",
    kategorie: "Levantinisch",
    bild: "img/falafel.svg",
    emoji: "🧆",
    farbe: ["#5a6a1e", "#d8d07a"],
    portionen: "ca. 24 Stück",
    zeit: "40 Min. + über Nacht einweichen",
    teaser: "Außen knusprig, innen leuchtend grün: Falafel aus eingeweichten Kichererbsen mit viel Petersilie, Koriander und Kreuzkümmel – mit Hummus und Joghurtsauce im Fladenbrot.",
    tags: ["vegan", "Mezze", "Wochenende"],
    abschnitte: [{"zutaten": [["250 g", "Getrocknete Kichererbsen (nicht aus der Dose!)"], ["1", "Zwiebel"], ["3", "Knoblauchzehen"], ["1 Bund", "Glatte Petersilie"], ["½ Bund", "Frischer Koriander"], ["2 TL", "Kreuzkümmel"], ["1 TL", "Koriandersamen, gemahlen"], ["½ TL", "Pul Biber"], ["1 TL", "Salz"], ["1 TL", "Backpulver"], ["2 EL", "Sesam (optional)"], ["1 l", "Frittieröl"]], "schritte": [{"t": "Kichererbsen einweichen", "x": "Kichererbsen mit reichlich kaltem Wasser bedecken und über Nacht quellen lassen. Sie werden roh verarbeitet – nicht kochen!", "z": "12 Std."}, {"t": "Grob hacken", "x": "Abgießen und gut trocken tupfen. Mit Zwiebel, Knoblauch und den Kräutern im Mixer oder Fleischwolf fein, aber nicht breiig zerkleinern – die Masse soll krümelig sein."}, {"t": "Würzen & ruhen", "x": "Gewürze, Salz, Backpulver und Sesam untermischen. Masse abgedeckt kalt stellen, dann bindet sie besser.", "z": "30 Min."}, {"t": "Formen", "x": "Mit feuchten Händen oder einem Falafelformer walnussgroße Bällchen formen und leicht flach drücken."}, {"t": "Frittieren", "x": "Öl auf 175 °C erhitzen und die Falafel portionsweise tiefbraun frittieren.", "z": "3–4 Min."}, {"t": "Servieren", "x": "Auf Küchenpapier abtropfen lassen und mit Hummus, Knoblauch-Joghurt, Tomaten und Gurken im Fladenbrot servieren."}]}],
    tipps: ["Dosen-Kichererbsen sind zu weich – die Falafel zerfallen dann im Öl.", "Zum Testen erst ein Bällchen frittieren. Zerfällt es, einen Löffel Mehl unterkneten.", "Ofen-Variante: mit Öl bepinseln und bei 200 °C 25 Min. backen, einmal wenden."]
  },
  {
    id: "shawarma",
    titel: "Hähnchen-Shawarma aus dem Ofen",
    kategorie: "Levantinisch",
    bild: "img/shawarma.svg",
    emoji: "🌯",
    farbe: ["#8a4a1a", "#f0c27a"],
    portionen: "4 Portionen",
    zeit: "45 Min. + 2 Std. marinieren",
    teaser: "Hähnchenschenkel in Joghurt, Zitrone und Shawarma-Gewürzen mariniert, im Ofen knusprig gebacken und dünn aufgeschnitten – im Fladenbrot mit Knoblauchsauce wie vom Imbiss.",
    tags: ["Hähnchen", "Familie", "Imbiss"],
    abschnitte: [{"titel": "Hähnchen", "zutaten": [["800 g", "Hähnchenschenkel ohne Knochen"], ["150 g", "Joghurt"], ["1", "Zitrone (Saft)"], ["3", "Knoblauchzehen"], ["2 EL", "Olivenöl"], ["2 TL", "Kreuzkümmel"], ["2 TL", "Paprikapulver edelsüß"], ["1 TL", "Kurkuma"], ["½ TL", "Zimt"], ["½ TL", "Piment oder Koriandersamen"], ["1 TL", "Salz"], ["", "Pfeffer"]], "schritte": [{"t": "Marinade rühren", "x": "Joghurt, Zitronensaft, geriebenen Knoblauch, Öl, Gewürze und Salz verrühren."}, {"t": "Marinieren", "x": "Hähnchen darin wenden und abgedeckt im Kühlschrank marinieren – über Nacht ist noch besser.", "z": "mind. 2 Std."}, {"t": "Backen", "x": "Hähnchen nebeneinander auf ein Blech legen und im Ofen bei 220 °C Umluft backen, bis die Ränder dunkel und knusprig sind.", "z": "25–30 Min."}, {"t": "Aufschneiden", "x": "Kurz ruhen lassen und in dünne Streifen schneiden, dabei den Bratensaft darübergeben."}]}, {"titel": "Zum Servieren", "zutaten": [["4", "Fladenbrote oder Yufka-Fladen"], ["200 g", "Joghurt"], ["1", "Knoblauchzehe"], ["2", "Tomaten"], ["½", "Gurke"], ["1", "Rote Zwiebel"], ["", "Salat, Petersilie, Sumach"]], "schritte": [{"t": "Knoblauchsauce", "x": "Joghurt mit geriebenem Knoblauch und Salz verrühren."}, {"t": "Füllen", "x": "Fladen kurz erwärmen, mit Sauce bestreichen, Hähnchen, Tomaten, Gurke, Zwiebelringe mit Sumach und Salat darauf und fest einrollen."}]}],
    tipps: ["Schenkel bleiben saftiger als Brust – genau das macht Shawarma aus.", "Für extra Röstaromen die letzten 3 Min. unter den Grill.", "Übriges Hähnchen schmeckt auch auf Reis oder Salat."]
  },
  {
    id: "lahmacun",
    titel: "Lahmacun",
    kategorie: "Türkisch",
    bild: "img/lahmacun.svg",
    emoji: "🍕",
    farbe: ["#a8321e", "#f2b07a"],
    portionen: "8 Fladen",
    zeit: "1 Std. + Teig gehen lassen",
    teaser: "Die hauchdünne türkische Pizza mit würzigem Hackbelag – heiß aus dem Ofen mit Zitrone, Petersilie und Zwiebeln belegt, eingerollt und aus der Hand gegessen.",
    tags: ["Familie", "Wochenende", "Imbiss"],
    abschnitte: [{"titel": "Teig", "zutaten": [["500 g", "Weizenmehl Type 405"], ["300 ml", "Lauwarmes Wasser"], ["7 g", "Trockenhefe"], ["1 TL", "Zucker"], ["1 TL", "Salz"], ["2 EL", "Olivenöl"]], "schritte": [{"t": "Teig kneten", "x": "Alle Zutaten zu einem glatten, weichen Teig verkneten. Alternativ den Pizzateig aus der Sammlung nehmen.", "z": "10 Min."}, {"t": "Gehen lassen", "x": "Abgedeckt an einem warmen Ort gehen lassen, bis er sich verdoppelt hat.", "z": "1 Std."}]}, {"titel": "Belag", "zutaten": [["300 g", "Rinder- oder Lammhack"], ["1", "Zwiebel"], ["1", "Rote Spitzpaprika"], ["2", "Tomaten"], ["2", "Knoblauchzehen"], ["½ Bund", "Glatte Petersilie"], ["2 EL", "Tomatenmark"], ["1 EL", "Paprikamark (Biber Salçası)"], ["1 TL", "Pul Biber"], ["1 TL", "Kreuzkümmel"], ["1 TL", "Salz"]], "schritte": [{"t": "Belag pürieren", "x": "Zwiebel, Paprika, Tomaten, Knoblauch und Petersilie sehr fein hacken oder kurz im Mixer zerkleinern. Mit Hack, Tomaten- und Paprikamark und Gewürzen gut verkneten."}, {"t": "Ofen vorheizen", "x": "Ofen mit Blech (oder Pizzastein) auf höchste Stufe vorheizen, 250–275 °C."}, {"t": "Ausrollen & bestreichen", "x": "Teig in 8 Kugeln teilen, jede auf Backpapier sehr dünn oval ausrollen und den Belag hauchdünn bis zum Rand verstreichen."}, {"t": "Backen", "x": "Einzeln oder zu zweit auf das heiße Blech ziehen und backen, bis der Rand knusprig ist.", "z": "6–8 Min."}]}, {"titel": "Zum Servieren", "zutaten": [["2", "Zitronen"], ["1 Bund", "Glatte Petersilie"], ["1", "Rote Zwiebel"], ["", "Sumach"]], "schritte": [{"t": "Servieren", "x": "Mit Zitronensaft beträufeln, Petersilie und Zwiebelringe mit Sumach darauflegen, einrollen und sofort essen."}]}],
    tipps: ["Der Belag muss wirklich hauchdünn sein – das Hack gart roh auf dem Teig.", "Fertige Lahmacun stapeln und mit einem Tuch abdecken, dann bleiben sie weich zum Rollen.", "Mit einem Glas Ayran servieren."]
  },
  {
    id: "mercimek",
    titel: "Rote Linsensuppe (Mercimek Çorbası)",
    kategorie: "Türkisch",
    bild: "img/mercimek.svg",
    emoji: "🍲",
    farbe: ["#b85a12", "#f6c05a"],
    portionen: "4 Portionen",
    zeit: "35 Min.",
    teaser: "Samtig, wärmend und in einer guten halben Stunde fertig: die türkische Linsensuppe mit Karotte und Kartoffel – mit Paprika-Minz-Butter und reichlich Zitrone.",
    tags: ["vegetarisch", "Suppe", "Familie"],
    abschnitte: [{"titel": "Suppe", "zutaten": [["250 g", "Rote Linsen"], ["1", "Zwiebel"], ["1", "Karotte"], ["1", "Kleine Kartoffel"], ["2 EL", "Butter oder Olivenöl"], ["1 EL", "Tomatenmark"], ["1,2 l", "Gemüsebrühe"], ["1 TL", "Kreuzkümmel"], ["", "Salz & Pfeffer"]], "schritte": [{"t": "Gemüse würfeln", "x": "Zwiebel, Karotte und Kartoffel schälen und klein würfeln. Linsen in einem Sieb waschen, bis das Wasser klar ist."}, {"t": "Andünsten", "x": "Butter im Topf erhitzen, Zwiebel glasig dünsten, Karotte und Kartoffel kurz mitdünsten, Tomatenmark einrühren und kurz rösten.", "z": "5 Min."}, {"t": "Köcheln", "x": "Linsen und Brühe dazugeben, aufkochen und zugedeckt köcheln, bis alles weich ist. Gelegentlich umrühren.", "z": "20 Min."}, {"t": "Pürieren", "x": "Fein pürieren, mit Kreuzkümmel, Salz und Pfeffer abschmecken. Ist sie zu dick, etwas Wasser dazugeben."}]}, {"titel": "Paprika-Minz-Butter", "zutaten": [["2 EL", "Butter"], ["1 TL", "Paprikapulver edelsüß"], ["½ TL", "Pul Biber"], ["1 TL", "Getrocknete Minze"], ["1", "Zitrone"]], "schritte": [{"t": "Butter bräunen", "x": "Butter schmelzen, vom Herd nehmen, Paprika, Pul Biber und Minze einrühren – nicht verbrennen lassen.", "z": "1 Min."}, {"t": "Servieren", "x": "Suppe in Schalen füllen, rote Butter darüberträufeln und mit einer Zitronenspalte servieren."}]}],
    tipps: ["Zitrone ist Pflicht – erst der Spritzer macht die Suppe richtig frisch.", "Dazu passt knuspriges Fladenbrot.", "Hält sich 3 Tage im Kühlschrank und dickt nach, dann mit Wasser verdünnen."]
  },
  {
    id: "tabouleh",
    titel: "Tabouleh",
    kategorie: "Libanesisch",
    bild: "img/tabouleh.svg",
    emoji: "🥗",
    farbe: ["#3f7a22", "#c8e08a"],
    portionen: "4 Portionen",
    zeit: "25 Min.",
    teaser: "Der libanesische Petersiliensalat: viel mehr Grün als Bulgur, dazu Tomate, Minze, Frühlingszwiebel und reichlich Zitrone und Olivenöl.",
    tags: ["vegan", "Mezze", "Salat"],
    abschnitte: [{"zutaten": [["50 g", "Feiner Bulgur"], ["3 Bund", "Glatte Petersilie"], ["½ Bund", "Frische Minze"], ["3", "Tomaten"], ["3", "Frühlingszwiebeln"], ["2", "Zitronen (Saft)"], ["5 EL", "Olivenöl"], ["½ TL", "Piment oder Baharat (optional)"], ["", "Salz & Pfeffer"]], "schritte": [{"t": "Bulgur quellen", "x": "Bulgur mit dem Saft einer Zitrone und 3 EL heißem Wasser übergießen und quellen lassen.", "z": "15 Min."}, {"t": "Kräuter hacken", "x": "Petersilie und Minze waschen, sehr gut trocken schleudern und mit einem scharfen Messer fein schneiden – nicht im Mixer, sonst wird es matschig."}, {"t": "Gemüse schneiden", "x": "Tomaten klein würfeln, Frühlingszwiebeln in feine Ringe schneiden."}, {"t": "Anmachen", "x": "Alles mit Bulgur, restlichem Zitronensaft, Olivenöl, Gewürzen, Salz und Pfeffer vermengen und kurz durchziehen lassen.", "z": "10 Min."}]}],
    tipps: ["Die Kräuter müssen ganz trocken sein, sonst wird der Salat wässrig.", "Tabouleh ist ein Kräutersalat – der Bulgur ist nur Beiwerk.", "Mit Romanasalatblättern als Löffel servieren."]
  },
  {
    id: "babaganoush",
    titel: "Baba Ganoush",
    kategorie: "Levantinisch",
    bild: "img/babaganoush.svg",
    emoji: "🍆",
    farbe: ["#4a2a5a", "#c8a8c8"],
    portionen: "4 Portionen als Mezze",
    zeit: "50 Min.",
    teaser: "Auberginen im Ofen geröstet, bis sie rauchig und butterweich sind – mit Tahini, Zitrone und Knoblauch zu einer cremigen Mezze verrührt, obenauf Granatapfelkerne.",
    tags: ["vegan", "Mezze"],
    abschnitte: [{"zutaten": [["2", "Große Auberginen"], ["3 EL", "Tahini"], ["1", "Zitrone (Saft)"], ["1", "Knoblauchzehe"], ["2 EL", "Olivenöl"], ["½ TL", "Kreuzkümmel"], ["", "Salz"], ["", "Granatapfelkerne, Petersilie, Paprikapulver"]], "schritte": [{"t": "Auberginen rösten", "x": "Auberginen mehrmals mit einer Gabel einstechen und im Ofen bei 230 °C (oder direkt über der Gasflamme) rösten, bis die Haut schwarz und das Innere ganz weich ist. Einmal wenden.", "z": "40 Min."}, {"t": "Auskratzen", "x": "Etwas abkühlen lassen, längs aufschneiden und das Fruchtfleisch herauslöffeln. In einem Sieb kurz abtropfen lassen.", "z": "10 Min."}, {"t": "Verrühren", "x": "Mit einer Gabel zerdrücken und mit Tahini, Zitronensaft, geriebenem Knoblauch, Kreuzkümmel und Salz verrühren."}, {"t": "Anrichten", "x": "Auf einem Teller verstreichen, Olivenöl darüber, mit Granatapfelkernen, Petersilie und etwas Paprika bestreuen."}]}],
    tipps: ["Je dunkler die Haut, desto rauchiger das Aroma – keine Angst vor Schwarz.", "Mit der Gabel statt im Mixer: so bleibt eine schöne Struktur.", "Passt zu Fladenbrot und zum Köfte-Teller."]
  },
  {
    id: "bulgur",
    titel: "Bulgur-Pilav",
    kategorie: "Türkisch",
    bild: "img/bulgur.svg",
    emoji: "🌾",
    farbe: ["#a8421e", "#f2a86a"],
    portionen: "4 Portionen als Beilage",
    zeit: "30 Min.",
    teaser: "Die türkische Beilage schlechthin: grober Bulgur mit Zwiebel, Tomaten- und Paprikamark geschmort – körnig, würzig und die perfekte Alternative zu Reis bei Köfte.",
    tags: ["vegan", "Beilage"],
    abschnitte: [{"zutaten": [["250 g", "Grober Bulgur (Pilavlık)"], ["1", "Zwiebel"], ["1", "Grüne Spitzpaprika"], ["2 EL", "Olivenöl oder Butter"], ["1 EL", "Tomatenmark"], ["1 EL", "Paprikamark (Biber Salçası)"], ["500 ml", "Heiße Brühe"], ["1 TL", "Salz"], ["", "Pfeffer, Pul Biber"]], "schritte": [{"t": "Andünsten", "x": "Zwiebel und Paprika fein würfeln und im Öl glasig dünsten.", "z": "4 Min."}, {"t": "Mark rösten", "x": "Tomaten- und Paprikamark einrühren und kurz mitrösten, bis es duftet.", "z": "1 Min."}, {"t": "Bulgur dazu", "x": "Bulgur dazugeben und unter Rühren kurz anschwitzen, bis alle Körner rot überzogen sind."}, {"t": "Garen", "x": "Mit heißer Brühe aufgießen, salzen, aufkochen und zugedeckt bei kleinster Hitze garen, bis die Flüssigkeit aufgesogen ist.", "z": "15 Min."}, {"t": "Ruhen lassen", "x": "Vom Herd nehmen, ein Küchentuch unter den Deckel legen und ziehen lassen. Mit einer Gabel auflockern.", "z": "10 Min."}]}],
    tipps: ["Unbedingt groben Bulgur nehmen – der feine ist für Salate.", "Das Tuch unter dem Deckel fängt Dampf auf, so wird der Bulgur schön körnig.", "Mit Joghurt und Hirtensalat ist es fast schon ein ganzes Essen."]
  },
  {
    id: "coban",
    titel: "Hirtensalat (Çoban Salatası)",
    kategorie: "Türkisch",
    bild: "img/coban.svg",
    emoji: "🥒",
    farbe: ["#2f5fa8", "#a8d0e8"],
    portionen: "4 Portionen",
    zeit: "15 Min.",
    teaser: "Klein gewürfelte Tomaten, Gurke, Spitzpaprika und Zwiebeln mit Petersilie, Zitrone, Olivenöl und Sumach – frisch, knackig und die ideale Beilage zu allem vom Grill.",
    tags: ["vegan", "Salat", "Grillen"],
    abschnitte: [{"zutaten": [["4", "Tomaten"], ["1", "Salatgurke"], ["2", "Grüne Spitzpaprika"], ["1", "Rote Zwiebel"], ["½ Bund", "Glatte Petersilie"], ["1", "Zitrone (Saft)"], ["4 EL", "Olivenöl"], ["1 TL", "Sumach"], ["", "Salz"], ["", "Granatapfelsirup (optional)"]], "schritte": [{"t": "Zwiebel vorbereiten", "x": "Zwiebel in feine Halbringe schneiden, mit etwas Salz und dem Sumach verkneten – so wird sie milder."}, {"t": "Gemüse würfeln", "x": "Tomaten, Gurke und Paprika in kleine, gleichmäßige Würfel schneiden, Petersilie hacken."}, {"t": "Anmachen", "x": "Alles in einer Schüssel mit Zitronensaft und Olivenöl vermengen und mit Salz abschmecken. Nach Wunsch mit etwas Granatapfelsirup beträufeln."}, {"t": "Servieren", "x": "Sofort servieren, solange das Gemüse knackig ist."}]}],
    tipps: ["Erst kurz vor dem Essen salzen, sonst ziehen Tomate und Gurke Wasser.", "Je kleiner die Würfel, desto typischer.", "Perfekt zu Köfte, Lahmacun und Bulgur-Pilav."]
  },
  {
    id: "suetlac",
    titel: "Sütlaç – Milchreis aus dem Ofen",
    kategorie: "Türkisch",
    bild: "img/suetlac.svg",
    emoji: "🍮",
    farbe: ["#8a4a24", "#f0d0a0"],
    portionen: "6 Schälchen",
    zeit: "50 Min. + 2 Std. kühlen",
    teaser: "Der türkische Milchreis: cremig gekocht, in Schälchen gefüllt und unter dem Grill gebräunt, bis die Oberfläche karamellige Flecken bekommt – kalt mit Zimt serviert.",
    tags: ["vegetarisch", "süß", "Dessert"],
    abschnitte: [{"zutaten": [["100 g", "Rundkornreis (Milchreis)"], ["300 ml", "Wasser"], ["1 l", "Vollmilch"], ["130 g", "Zucker"], ["2 EL", "Reismehl oder Speisestärke"], ["1 Pck.", "Vanillezucker"], ["", "Zimt zum Bestreuen"]], "schritte": [{"t": "Reis vorkochen", "x": "Reis waschen und im Wasser kochen, bis das Wasser fast aufgesogen ist.", "z": "10 Min."}, {"t": "Mit Milch köcheln", "x": "Milch dazugießen und unter häufigem Rühren sanft köcheln lassen, bis der Reis ganz weich ist.", "z": "20 Min."}, {"t": "Binden", "x": "Reismehl mit etwas kalter Milch oder Wasser glatt rühren, mit Zucker und Vanillezucker einrühren und weitere Minuten köcheln, bis es cremig bindet.", "z": "5 Min."}, {"t": "Abfüllen", "x": "In ofenfeste Schälchen füllen und in eine Auflaufform mit etwas kaltem Wasser stellen."}, {"t": "Bräunen", "x": "Unter dem vorgeheizten Ofengrill auf oberster Schiene bräunen, bis die Oberfläche braune Flecken hat. Dabei nicht aus den Augen lassen.", "z": "8–12 Min."}, {"t": "Kühlen", "x": "Abkühlen lassen und im Kühlschrank durchkühlen. Vor dem Servieren mit Zimt bestäuben.", "z": "2 Std."}]}],
    tipps: ["Das kalte Wasserbad verhindert, dass der Milchreis unten anbrennt, während die Oberfläche bräunt.", "Reismehl macht ihn besonders cremig – Speisestärke geht auch.", "Mit gehackten Pistazien noch schöner."]
  },
  {
    id: "bao",
    titel: "Bao mit Hackfüllung",
    kategorie: "Chinesisch",
    bild: "img/bao.svg",
    emoji: "🥟",
    farbe: ["#a86a3a", "#f2e2c0"],
    portionen: "12 Bao",
    zeit: "1 Std. + 1,5 Std. gehen",
    teaser: "Schneeweiße, leicht süße und herrlich fluffige Dampfbrötchen mit saftiger Füllung aus Schweinehack, Shiitake, Ingwer und Frühlingszwiebeln – im Bambuskorb gedämpft.",
    tags: ["asiatisch", "Wochenende", "Familie"],
    abschnitte: [{"titel": "Teig", "zutaten": [["500 g", "Weizenmehl Type 405"], ["7 g", "Trockenhefe"], ["50 g", "Zucker"], ["1 TL", "Backpulver"], ["½ TL", "Salz"], ["250 ml", "Lauwarme Milch"], ["2 EL", "Pflanzenöl"]], "schritte": [{"t": "Teig kneten", "x": "Mehl, Hefe, Zucker, Backpulver und Salz mischen. Milch und Öl dazugeben und zu einem sehr glatten, geschmeidigen Teig kneten – je länger, desto feiner und weißer werden die Bao.", "z": "10 Min."}, {"t": "Gehen lassen", "x": "Abgedeckt an einem warmen Ort gehen lassen, bis der Teig sich verdoppelt hat.", "z": "1 Std."}]}, {"titel": "Füllung", "zutaten": [["400 g", "Schweinehack (nicht zu mager)"], ["4", "Getrocknete Shiitake-Pilze"], ["3", "Frühlingszwiebeln"], ["1 Stück (3 cm)", "Ingwer"], ["2", "Knoblauchzehen"], ["2 EL", "Sojasauce"], ["1 EL", "Austernsauce"], ["1 TL", "Sesamöl"], ["1 TL", "Zucker"], ["1 TL", "Speisestärke"], ["3 EL", "Wasser"], ["", "Weißer Pfeffer"]], "schritte": [{"t": "Pilze einweichen", "x": "Shiitake in heißem Wasser einweichen, dann ausdrücken, Stiele entfernen und fein hacken.", "z": "20 Min."}, {"t": "Füllung verkneten", "x": "Frühlingszwiebeln, Ingwer und Knoblauch fein hacken. Alles mit Hack, Saucen, Sesamöl, Zucker, Stärke, Wasser und Pfeffer in eine Richtung rühren, bis die Masse klebrig und saftig ist. Kalt stellen."}]}, {"titel": "Formen & Dämpfen", "zutaten": [["12", "Backpapier-Quadrate (8 × 8 cm)"]], "schritte": [{"t": "Portionieren", "x": "Teig kurz durchkneten, zu einer Rolle formen und in 12 Stücke teilen. Jedes Stück zu einem Kreis von ca. 10 cm ausrollen – Rand dünner als die Mitte."}, {"t": "Füllen & falten", "x": "Einen gehäuften Esslöffel Füllung in die Mitte setzen. Den Rand ringsum in kleinen Falten nach oben ziehen und oben zusammendrehen. Jede Bao auf ein Backpapier-Quadrat setzen."}, {"t": "Nochmal gehen lassen", "x": "Im Dämpfkorb mit Abstand zueinander abgedeckt ruhen lassen, bis sie sichtbar aufgegangen sind.", "z": "20–30 Min."}, {"t": "Dämpfen", "x": "Wasser im Topf oder Wok zum Kochen bringen, Korb daraufsetzen und bei mittlerer Hitze dämpfen. Den Deckel mit einem Tuch umwickeln, damit kein Kondenswasser auf die Bao tropft.", "z": "15 Min."}, {"t": "Ruhen lassen", "x": "Herd ausschalten und den Deckel noch 3 Minuten geschlossen lassen – so fallen die Bao nicht zusammen. Dann heiß servieren, gerne mit Sojasauce und Chiliöl zum Dippen.", "z": "3 Min."}]}],
    tipps: ["Bao lassen sich hervorragend einfrieren und gefroren 20 Min. dämpfen.", "Ohne Bambuskorb geht ein Metall-Dämpfeinsatz im großen Topf.", "Für extra weiße Bao einen Teil des Mehls durch Weizenstärke ersetzen."]
  },
  {
    id: 'teriyaki', titel: 'Teriyaki-Hähnchen mit Reis', kategorie: 'Japanisch', bild: 'img/teriyaki.svg', emoji: '🍗',
    farbe: ['#8e2a1c', '#e8925a'], portionen: '4 Portionen', zeit: '30 Min.',
    teaser: 'Zarte Hähnchenstücke in glänzend-klebriger Soja-Honig-Sauce mit Ingwer und Knoblauch – auf Reis, mit Brokkoli, Sesam und Frühlingszwiebeln.',
    tags: ['asiatisch', 'Familie', 'schnell'],
    abschnitte: [
      { titel: 'Reis', zutaten: [['300 g', 'Basmati- oder Jasminreis'], ['', 'Salz']],
        schritte: [{ t: 'Reis kochen', x: 'Reis in einem Sieb waschen, bis das Wasser klar ist, und nach Packungsangabe garen.', z: '15 Min.' }] },
      { titel: 'Teriyaki-Sauce', zutaten: [['6 EL', 'Sojasauce'], ['3 EL', 'Honig'], ['2 EL', 'Reisessig oder Zitronensaft'], ['1 Stück (2 cm)', 'Ingwer, gerieben'], ['2', 'Knoblauchzehen, gerieben'], ['1 TL', 'Speisestärke'], ['4 EL', 'Wasser']],
        schritte: [{ t: 'Sauce anrühren', x: 'Sojasauce, Honig, Essig, Ingwer und Knoblauch verrühren. Stärke mit dem Wasser glatt rühren und dazugeben.' }] },
      { titel: 'Hähnchen & Gemüse', zutaten: [['600 g', 'Hähnchenbrust oder -schenkel'], ['1 EL', 'Pflanzenöl'], ['1 Kopf', 'Brokkoli'], ['3', 'Frühlingszwiebeln'], ['1 EL', 'Sesam']],
        schritte: [
          { t: 'Hähnchen schneiden', x: 'Hähnchen in mundgerechte Stücke schneiden, Brokkoli in Röschen teilen, Frühlingszwiebeln in Ringe schneiden.' },
          { t: 'Brokkoli garen', x: 'Brokkoli in Salzwasser bissfest garen und abgießen.', z: '4 Min.' },
          { t: 'Hähnchen anbraten', x: 'Öl in einer großen Pfanne stark erhitzen und das Hähnchen rundherum goldbraun anbraten.', z: '6–8 Min.' },
          { t: 'Sauce einkochen', x: 'Sauce angießen und unter Rühren köcheln, bis sie dick und glänzend ist und das Hähnchen überzieht.', z: '2–3 Min.' },
          { t: 'Servieren', x: 'Reis in Schalen füllen, Hähnchen und Brokkoli darauf, mit Sesam und Frühlingszwiebeln bestreuen.' }
        ] }
    ],
    tipps: ['Hähnchenschenkel bleiben saftiger als Brust.', 'Sesam kurz in der trockenen Pfanne rösten – das gibt viel Aroma.', 'Wer es schärfer mag: eine Prise Chiliflocken in die Sauce.']
  },
  {
    id: 'eierreis', titel: 'Gebratener Eierreis mit Hühnchen', kategorie: 'Chinesisch', bild: 'img/eierreis.svg', emoji: '🍚',
    farbe: ['#9a6a12', '#f2d06a'], portionen: '4 Portionen', zeit: '25 Min.',
    teaser: 'Der Klassiker aus dem Wok: Reis vom Vortag, zerzupftes Rührei, Hähnchen, Erbsen und Karotten – mit Sojasauce knusprig gebraten.',
    tags: ['asiatisch', 'Resteverwertung', 'schnell'],
    abschnitte: [{
      zutaten: [['600 g', 'Gekochter Reis vom Vortag (ca. 250 g roh)'], ['400 g', 'Hähnchenbrust'], ['3', 'Eier'], ['150 g', 'Erbsen (TK)'], ['2', 'Karotten'], ['3', 'Frühlingszwiebeln'], ['2', 'Knoblauchzehen'], ['3 EL', 'Sojasauce'], ['1 TL', 'Sesamöl'], ['2 EL', 'Pflanzenöl'], ['', 'Salz & Pfeffer']],
      schritte: [
        { t: 'Zutaten vorbereiten', x: 'Hähnchen klein würfeln, Karotten fein würfeln, Frühlingszwiebeln in Ringe schneiden, Knoblauch hacken. Eier verquirlen. Alles griffbereit stellen – im Wok geht es schnell.' },
        { t: 'Hähnchen anbraten', x: '1 EL Öl im Wok stark erhitzen, Hähnchen goldbraun braten, salzen und herausnehmen.', z: '5 Min.' },
        { t: 'Rührei braten', x: 'Eier in den heißen Wok geben, stocken lassen, grob zerzupfen und ebenfalls herausnehmen.', z: '1 Min.' },
        { t: 'Gemüse braten', x: 'Restliches Öl erhitzen, Knoblauch, Karotten und das Weiße der Frühlingszwiebeln kurz anbraten, Erbsen dazugeben.', z: '3 Min.' },
        { t: 'Reis braten', x: 'Kalten Reis dazugeben, mit dem Pfannenwender zerteilen und unter Rühren braten, bis er leicht knusprig ist.', z: '4–5 Min.' },
        { t: 'Abschmecken', x: 'Hähnchen und Ei zurück in den Wok, mit Sojasauce und Sesamöl würzen, pfeffern und mit dem Grün der Frühlingszwiebeln bestreuen.' }
      ]
    }],
    tipps: ['Unbedingt Reis vom Vortag nehmen – frischer Reis klebt und wird matschig.', 'Die Pfanne muss richtig heiß sein und nicht zu voll, sonst dünstet der Reis statt zu braten.', 'Übrige Gemüsereste (Paprika, Mais, Brokkoli) passen auch hinein.']
  },
  {
    id: 'wantan', titel: 'Knusprige Wan Tans mit Koriander-Hack', kategorie: 'Chinesisch', bild: 'img/wantan.svg', emoji: '🥟',
    farbe: ['#9a4a12', '#f2b45a'], portionen: 'ca. 40 Stück', zeit: '1 Std.',
    teaser: 'Kleine Säckchen aus Wan-Tan-Teig, gefüllt mit würzigem Hack, frischem Koriander, Ingwer und Knoblauch – goldbraun frittiert und mit Sweet-Chili-Sauce gedippt.',
    tags: ['asiatisch', 'Fingerfood', 'Wochenende'],
    abschnitte: [
      { titel: 'Füllung', zutaten: [['400 g', 'Schweinehack (oder gemischtes Hack)'], ['1 Bund', 'Frischer Koriander'], ['2', 'Frühlingszwiebeln'], ['2', 'Knoblauchzehen'], ['1 Stück (2 cm)', 'Ingwer'], ['2 EL', 'Sojasauce'], ['1 EL', 'Austernsauce'], ['1 TL', 'Sesamöl'], ['1 TL', 'Speisestärke'], ['', 'Weißer Pfeffer']],
        schritte: [
          { t: 'Kräuter hacken', x: 'Koriander samt zarten Stielen fein hacken, Frühlingszwiebeln in feine Ringe schneiden, Knoblauch und Ingwer fein reiben.' },
          { t: 'Füllung mischen', x: 'Hack mit allen Zutaten gründlich verkneten, bis die Masse leicht klebrig ist – so hält sie beim Frittieren zusammen.' }
        ] },
      { titel: 'Wan Tans formen', zutaten: [['1 Pck. (ca. 40 Blatt)', 'Wan-Tan-Teigblätter (TK, Asialaden)'], ['1', 'Ei zum Verkleben']],
        schritte: [
          { t: 'Teig auftauen', x: 'Teigblätter auftauen lassen und unter einem feuchten Tuch aufbewahren, damit sie nicht austrocknen.', z: '30 Min.' },
          { t: 'Füllen', x: 'Je 1 TL Füllung in die Mitte eines Blattes setzen, die Ränder dünn mit verquirltem Ei bestreichen.' },
          { t: 'Säckchen formen', x: 'Die vier Ecken nach oben zusammenführen und oberhalb der Füllung fest zusammendrücken, sodass kleine Säckchen entstehen. Luft dabei herausdrücken.' }
        ] },
      { titel: 'Frittieren', zutaten: [['1 l', 'Frittieröl (z.B. Rapsöl)'], ['', 'Sweet-Chili-Sauce zum Dippen']],
        schritte: [
          { t: 'Öl erhitzen', x: 'Öl in einem Topf oder Wok auf 170–175 °C erhitzen. Test: An einem Holzstäbchen steigen kleine Bläschen auf.' },
          { t: 'Frittieren', x: 'Wan Tans portionsweise goldbraun frittieren, dabei einmal wenden. Nicht zu viele auf einmal, sonst kühlt das Öl ab.', z: '3–4 Min.' },
          { t: 'Abtropfen & servieren', x: 'Auf Küchenpapier abtropfen lassen und sofort mit Sweet-Chili-Sauce servieren.' }
        ] }
    ],
    tipps: ['Die Füllung ist roh und gart beim Frittieren – deshalb nur 1 TL pro Tasche, sonst wird sie innen nicht durch.', 'Geformte Wan Tans lassen sich einfrieren und direkt gefroren frittieren (1 Min. länger).', 'Wer Koriander nicht mag: halb Koriander, halb Schnittlauch.']
  },
  {
    id: 'lachs', titel: 'Tagliatelle mit gebratenem Lachs', kategorie: 'Italienisch', bild: 'img/lachs.svg', emoji: '🐟',
    farbe: ['#b8482a', '#f7b08a'], portionen: '4 Portionen', zeit: '30 Min.',
    teaser: 'Italienisch statt Sahnesauce: Tagliatelle in Olivenöl, Knoblauch, Kirschtomaten, Zitrone und einem Schuss Weißwein – obenauf ein goldbraun gebratenes Lachsfilet ohne Haut.',
    tags: ['Fisch', 'Familie', 'italienisch'],
    abschnitte: [
      { titel: 'Lachs', zutaten: [['4 (à ca. 130 g)', 'Lachsfilets ohne Haut'], ['1 EL', 'Olivenöl'], ['', 'Salz & Pfeffer']],
        schritte: [
          { t: 'Haut entfernen', x: 'Falls die Filets noch Haut haben: mit der Haut nach unten aufs Brett legen, am Ende ein kleines Stück zwischen Fleisch und Haut einschneiden, die Haut festhalten und das Messer flach am Brett entlangführen.' },
          { t: 'Lachs vorbereiten', x: 'Lachs 15 Minuten vorher aus dem Kühlschrank nehmen, trocken tupfen und von beiden Seiten leicht salzen.' },
          { t: 'Lachs braten', x: 'Olivenöl in einer beschichteten Pfanne stark erhitzen, Lachs mit der schönen Seite nach unten hineinlegen und goldbraun anbraten.', z: '3 Min.' },
          { t: 'Wenden', x: 'Wenden, Pfanne vom Herd nehmen und den Lachs in der Resthitze glasig garziehen lassen, bis er innen gerade nicht mehr durchscheinend ist. Pfeffern.', z: '2–3 Min.' }
        ] },
      { titel: 'Tagliatelle', zutaten: [['400 g', 'Tagliatelle'], ['4 EL', 'Olivenöl extra vergine'], ['3', 'Knoblauchzehen'], ['250 g', 'Kirschtomaten'], ['1 Prise', 'Chiliflocken'], ['100 ml', 'Trockener Weißwein'], ['1', 'Bio-Zitrone (Abrieb + Saft)'], ['1 Bund', 'Glatte Petersilie'], ['1 Tasse', 'Nudelwasser'], ['', 'Salz & Pfeffer']],
        schritte: [
          { t: 'Pasta kochen', x: 'Tagliatelle in reichlich Salzwasser al dente kochen. Vor dem Abgießen eine Tasse Nudelwasser abschöpfen.', z: '8 Min.' },
          { t: 'Knoblauch anschwitzen', x: 'Knoblauch in dünne Scheiben schneiden und mit den Chiliflocken in Olivenöl sanft anschwitzen – er soll duften, nicht braun werden.', z: '1 Min.' },
          { t: 'Tomaten schmoren', x: 'Kirschtomaten halbieren, dazugeben und kurz schmoren, bis sie leicht zerfallen. Mit Weißwein ablöschen und etwas einkochen.', z: '4 Min.' },
          { t: 'Vermengen', x: 'Tagliatelle in die Pfanne geben, mit Zitronenabrieb, einem Spritzer Zitronensaft, gehackter Petersilie und einem Schuss Nudelwasser schwenken, bis alles glänzt.' },
          { t: 'Servieren', x: 'Pasta auf Teller verteilen, Lachs mit der gebräunten Seite nach oben daraufsetzen oder in Stücke zupfen. Mit etwas Olivenöl beträufeln.' }
        ] }
    ],
    tipps: ['Den Lachs nicht zu früh wenden – er löst sich von selbst, wenn er gebräunt ist. Ohne Haut ist er empfindlicher, daher sanft mit einem breiten Pfannenwender drehen.', 'Kein Parmesan zu Fisch, sagen die Italiener – stattdessen geröstete Semmelbrösel mit Zitronenabrieb darüberstreuen.', 'Statt Weißwein geht auch ein Schuss Gemüsebrühe.']
  },
  {
    id: "filet",
    titel: "Filet Mignon mit Kräuterbutter, Backkartoffel & Knoblauch-Röstbrot",
    kategorie: "Amerikanisch",
    bild: "img/filet.svg",
    emoji: "🥩",
    farbe: ["#5e2a14", "#d8946a"],
    portionen: "4 Portionen",
    zeit: "1 Std. 15 Min.",
    teaser: "Der Steakhaus-Klassiker für zuhause, so wie im Block House: rosa gebratenes Rinderfilet mit schmelzender Kräuterbutter, Backkartoffel mit Sour Cream und knuspriges Knoblauch-Röstbrot.",
    tags: ["Wochenende", "Gäste", "Steak"],
    abschnitte: [{"titel": "Kräuterbutter", "zutaten": [["125 g", "Weiche Butter"], ["2 EL", "Petersilie, fein gehackt"], ["1 EL", "Schnittlauch"], ["1", "Knoblauchzehe"], ["1 Spritzer", "Zitronensaft"], ["½ TL", "Salz"], ["", "Pfeffer"]], "schritte": [{"t": "Butter rühren", "x": "Butter mit Kräutern, geriebenem Knoblauch, Zitronensaft, Salz und Pfeffer verrühren."}, {"t": "Rolle formen", "x": "Auf Frischhaltefolie zu einer Rolle formen, eindrehen und kalt stellen, bis sie fest ist.", "z": "30 Min."}]}, {"titel": "Backkartoffel mit Sour Cream", "zutaten": [["4", "Große mehligkochende Kartoffeln"], ["1 EL", "Öl"], ["", "Grobes Salz"], ["200 g", "Schmand oder Crème fraîche"], ["1 Bund", "Schnittlauch"], ["1 Spritzer", "Zitronensaft"], ["", "Salz & Pfeffer"]], "schritte": [{"t": "Kartoffeln backen", "x": "Ofen auf 200 °C vorheizen. Kartoffeln waschen, mehrmals mit der Gabel einstechen, mit Öl und grobem Salz einreiben, in Alufolie wickeln und backen, bis sie ganz weich sind.", "z": "60 Min."}, {"t": "Sour Cream rühren", "x": "Schmand mit Schnittlauchröllchen, Zitronensaft, Salz und Pfeffer verrühren."}, {"t": "Aufschneiden", "x": "Folie oben öffnen, die Kartoffel kreuzweise einschneiden, etwas auseinanderdrücken und einen großen Klecks Sour Cream hineingeben."}]}, {"titel": "Filet Mignon", "zutaten": [["4 (à 180–200 g)", "Rinderfilet-Steaks, 4 cm dick"], ["2 EL", "Butterschmalz oder Rapsöl"], ["", "Grobes Meersalz"], ["", "Pfeffer aus der Mühle"]], "schritte": [{"t": "Temperieren", "x": "Steaks 1 Stunde vorher aus dem Kühlschrank nehmen und trocken tupfen."}, {"t": "Scharf anbraten", "x": "Eine Grill- oder Gusseisenpfanne sehr stark erhitzen, Fett hineingeben und die Steaks ohne Bewegen von jeder Seite scharf anbraten, bis sich eine Kruste bildet.", "z": "2–3 Min./Seite"}, {"t": "Im Ofen garen", "x": "Steaks auf ein Gitter mit Blech darunter legen und im Ofen bei 120 °C auf die gewünschte Kerntemperatur bringen: 52 °C rare, 56 °C medium rare, 58–60 °C medium.", "z": "10–15 Min."}, {"t": "Ruhen & würzen", "x": "Kurz ruhen lassen, dann erst salzen und pfeffern. Mit einer dicken Scheibe Kräuterbutter obenauf servieren.", "z": "3 Min."}]}, {"titel": "Knoblauch-Röstbrot", "zutaten": [["4 dicke Scheiben", "Weißbrot oder Kastenweißbrot"], ["40 g", "Butter"], ["2", "Knoblauchzehen"], ["1 EL", "Petersilie"]], "schritte": [{"t": "Knoblauchbutter", "x": "Butter schmelzen, Knoblauch fein reiben und mit Petersilie einrühren."}, {"t": "Rösten", "x": "Brotscheiben von beiden Seiten mit Knoblauchbutter bestreichen und in der Pfanne oder unter dem Ofengrill goldbraun und knusprig rösten.", "z": "2 Min./Seite"}, {"t": "Anrichten", "x": "Steak mit Kräuterbutter, Backkartoffel mit Sour Cream und Röstbrot auf vorgewärmten Tellern anrichten. Dazu passt ein grüner Salat."}]}],
    tipps: ["Ein Fleischthermometer ist beim Filet Gold wert – so wird es genau auf den Punkt.", "Die Kartoffeln zuerst in den Ofen schieben, dann läuft alles andere nebenher.", "Kräuterbutter-Rolle hält sich eingefroren wochenlang – gleich die doppelte Menge machen."]
  },
  {
    id: "kartoffelpuffer",
    titel: "Kartoffelpuffer mit Sour Cream",
    kategorie: "Deutsch",
    bild: "img/kartoffelpuffer.svg",
    emoji: "🥔",
    farbe: ["#9a5a18", "#f2c874"],
    portionen: "4 Portionen (ca. 16 Puffer)",
    zeit: "45 Min.",
    teaser: "Außen knusprig, innen saftig: frisch geriebene Kartoffeln mit Zwiebel und Ei goldbraun in der Pfanne ausgebacken – mit einer kühlen Sour Cream mit Schnittlauch.",
    tags: ["vegetarisch", "Familie", "Klassiker"],
    abschnitte: [{"titel": "Kartoffelpuffer", "zutaten": [["1,5 kg", "Kartoffeln, mehligkochend"], ["1", "Zwiebel"], ["2", "Eier"], ["3 EL", "Mehl"], ["1 TL", "Salz"], ["", "Pfeffer, Muskat"], ["", "Butterschmalz oder Rapsöl zum Ausbacken"]], "schritte": [{"t": "Kartoffeln reiben", "x": "Kartoffeln schälen und mit der Zwiebel auf der groben Reibe in eine Schüssel reiben."}, {"t": "Ausdrücken", "x": "Die Masse in ein sauberes Küchentuch geben und kräftig auspressen – je trockener, desto knuspriger. Die Stärke, die sich im ausgedrückten Wasser absetzt, wieder zur Masse geben."}, {"t": "Teig mischen", "x": "Eier, Mehl, Salz, Pfeffer und etwas Muskat untermischen."}, {"t": "Ausbacken", "x": "Reichlich Fett in einer großen Pfanne stark erhitzen. Pro Puffer einen gehäuften Esslöffel Masse hineingeben, flach drücken und von beiden Seiten goldbraun und knusprig braten.", "z": "3–4 Min./Seite"}, {"t": "Abtropfen", "x": "Auf Küchenpapier abtropfen lassen und im Ofen bei 80 °C warm halten, bis alle fertig sind."}]}, {"titel": "Sour Cream", "zutaten": [["200 g", "Schmand oder Crème fraîche"], ["100 g", "Saure Sahne"], ["1 Bund", "Schnittlauch"], ["1 Spritzer", "Zitronensaft"], ["", "Salz & Pfeffer"]], "schritte": [{"t": "Sour Cream rühren", "x": "Schmand und saure Sahne glatt rühren, Schnittlauch in feine Röllchen schneiden und mit Zitronensaft, Salz und Pfeffer unterrühren. Kalt stellen, während die Puffer braten."}, {"t": "Servieren", "x": "Puffer heiß mit einem großen Klecks Sour Cream servieren. Dazu passen Räucherlachs oder ein grüner Salat."}]}],
    tipps: ["Die Kartoffeln erst kurz vor dem Braten reiben, sonst werden sie grau.", "Das Fett muss richtig heiß sein – dann saugen die Puffer sich nicht voll.", "Wer mag, reibt eine Möhre oder etwas Zucchini mit in die Masse."]
  },
  {
    id: 'bolognese', titel: 'Spaghetti Bolognese', kategorie: 'Italienisch', emoji: '🍝',
    farbe: ['#9c2f1f', '#e8866a'], portionen: '4 Portionen', zeit: '35 Min.',
    teaser: 'Das klassische Familienrezept mit Bio-Hack und gegrillter Paprika – leicht rauchig und am nächsten Tag noch besser.',
    tags: ['Familie', 'Klassiker'],
    abschnitte: [{
      zutaten: [['2', 'Zwiebeln'], ['400 g', 'Gemischtes Bio-Hackfleisch'], ['1 Glas', '„Gegrillte Paprika“-Sauce'], ['½ Stück', 'Parmesan'], ['400 g', 'Spaghetti'], ['2 EL', 'Olivenöl'], ['', 'Salz & Pfeffer']],
      schritte: [
        { t: 'Zwiebeln vorbereiten', x: 'Zwiebeln schälen und fein würfeln.' },
        { t: 'Zwiebeln andünsten', x: 'Olivenöl in einer großen Pfanne erhitzen. Zwiebelwürfel bei mittlerer Hitze glasig dünsten.', z: '5 Min.' },
        { t: 'Hack anbraten', x: 'Hackfleisch dazugeben und bei hoher Hitze krümelig anbraten, bis es schön gebräunt ist. Mit Salz & Pfeffer würzen.', z: '8 Min.' },
        { t: 'Sauce köcheln', x: 'Die „Gegrillte Paprika“-Sauce in die Pfanne geben, gut verrühren und auf kleiner Flamme köcheln lassen.', z: '20 Min.' },
        { t: 'Pasta kochen', x: 'Gleichzeitig Spaghetti in reichlich gesalzenem Wasser al dente kochen.', z: '10 Min.' },
        { t: 'Servieren', x: 'Spaghetti abgießen, auf Tellern anrichten, Bolognese darüber geben und Parmesan frisch über jede Portion reiben.' }
      ]
    }],
    tipps: ['Den Parmesan frisch am Stück reiben – das macht den Unterschied.', 'Die „Gegrillte Paprika“-Sauce gibt eine leicht rauchige Note, die das Rezept von der klassischen Tomatenvariante abhebt.', 'Reste schmecken am nächsten Tag noch besser!']
  },
  {
    id: 'cheeseburger', titel: 'Cheeseburger mit Bacon & Halloumi', kategorie: 'Amerikanisch', emoji: '🍔',
    farbe: ['#7a3b12', '#f0a64a'], portionen: '4 Burger', zeit: '2 Std. inkl. Buns',
    teaser: 'Selbstgebackene Brioche-Buns, drei saftige Rinder-Patties mit Bacon und Cheddar, ein Halloumi-Burger – dazu Pommes aus der Heißluftfritteuse.',
    tags: ['Wochenende', 'Grill'],
    abschnitte: [
      { titel: 'Brioche Buns', zutaten: [['300 g', 'Mehl'], ['120 ml', 'Milch, lauwarm'], ['1 TL', 'Trockenhefe'], ['1 EL', 'Zucker'], ['1 TL', 'Salz'], ['2', 'Eier (1 zum Bestreichen)'], ['50 g', 'Weiche Butter']],
        schritte: [{ t: 'Teig kneten', x: 'Alle Zutaten zu einem glatten Teig kneten und gehen lassen.', z: '1 Std.' }, { t: 'Formen', x: '4 Kugeln formen und nochmals ruhen lassen.', z: '30 Min.' }, { t: 'Backen', x: 'Mit Ei bestreichen und bei 180 °C goldbraun backen.', z: '15 Min.' }] },
      { titel: 'Burgersauce', zutaten: [['3 EL', 'Mayonnaise'], ['1 EL', 'Ketchup'], ['1 TL', 'Senf'], ['1 TL', 'Gurkenrelish oder fein gehackte Essiggurke'], ['½ TL', 'Paprikapulver'], ['½ TL', 'Knoblauchpulver'], ['½ TL', 'Zwiebelpulver']],
        schritte: [{ t: 'Verrühren', x: 'Alles verrühren und kalt stellen. Original-getreue Variante: BigMac Sauce.', link: 'bigmac' }] },
      { titel: 'Fleisch-Burger (3×)', zutaten: [['400 g', 'Rinderhack (mind. 20 % Fett)'], ['6 Scheiben', 'Bacon'], ['3 Scheiben', 'Cheddar']],
        schritte: [{ t: 'Patties formen', x: '3 Patties à ca. 130 g locker formen, eine Mulde in die Mitte drücken.' }, { t: 'Braten', x: 'In einer sehr heißen Pfanne pro Seite braten. Käse in den letzten 30 Sekunden unter dem Deckel schmelzen lassen. Bacon knusprig braten.', z: '2–3 Min./Seite' }] },
      { titel: 'Halloumi-Burger (1×)', zutaten: [['200 g', 'Halloumi, 1 cm dicke Scheiben'], ['1 EL', 'Olivenöl']],
        schritte: [{ t: 'Braten', x: 'In einer heißen Pfanne mit Olivenöl von jeder Seite goldbraun braten.', z: '2–3 Min./Seite' }] },
      { titel: 'Belag & Pommes', zutaten: [['1', 'Eisbergsalat'], ['1', 'Rote Zwiebel, in Ringen'], ['', 'Ketchup, Salz, Pfeffer'], ['', 'Tiefkühlpommes']],
        schritte: [{ t: 'Pommes', x: 'In der Heißluftfritteuse bei 180 °C garen, einmal schütteln.', z: '15–20 Min.' }, { t: 'Zusammenbauen', x: 'Von unten: Sauce → Salat → Patty / Halloumi → Bacon (nur Fleisch) → Zwiebeln → Ketchup → Sauce → Deckel.' }] }
    ]
  },
  {
    id: 'pizzateig', titel: 'Der beste Pizzateig', kategorie: 'Italienisch', emoji: '🍕',
    farbe: ['#a33a1c', '#f2b36b'], portionen: '4 Pizzen', zeit: '30 Min. + 8 Std. Gehzeit',
    teaser: 'Außen knusprig, innen luftig – mit nur 5 g Hefe, 20 Minuten Kneten und langer Gehzeit wird der Teig wie beim Italiener.',
    tags: ['vegan', 'Grundrezept'], quelle: 'https://www.chefkoch.de/rezepte/1151011221381450/Der-beste-Pizzateig.html',
    abschnitte: [
      { titel: 'Hefeteig', zutaten: [['500 g', 'Weizenmehl Type 405'], ['300 ml', 'Wasser, lauwarm'], ['2 TL', 'Salz'], ['5 g', 'Frische Hefe (oder 1,5–2 g Trockenhefe)']],
        schritte: [
          { t: 'Mehl vorbereiten', x: 'Mehl und Salz sieben und in die Küchenmaschine geben. Hefe in lauwarmem Wasser (30–37 °C) auflösen und dazugeben – Trockenhefe direkt unters Mehl mischen. Ja, 5 g Hefe reichen wirklich.' },
          { t: 'Teig kneten', x: 'Mit Küchenmaschine oder Knethaken zu einem elastischen Teig verkneten. Nicht abkürzen – die Knetzeit macht den Teig knusprig.', z: '20 Min.' },
          { t: 'Gehen lassen', x: 'Mit einem feuchten Tuch abgedeckt ruhen lassen.', z: '2 Std.' },
          { t: 'Kugeln formen', x: 'In 4 Stücke à ca. 200 g teilen, zu Kugeln formen und abgedeckt weiter gehen lassen – alternativ 12–24 Std. im Kühlschrank.', z: '6 Std.' }
        ] },
      { titel: 'Tomatensauce', zutaten: [['1 Dose', 'Pizzatomaten oder geschälte Tomaten (ca. 400 g)'], ['2', 'Knoblauchzehen'], ['', 'Salz & Pfeffer'], ['1 Prise', 'Zucker'], ['6 Blätter', 'Basilikum, frisch'], ['1 EL', 'Oregano, getrocknet']],
        schritte: [{ t: 'Sauce pürieren', x: 'Tomaten mit allen übrigen Zutaten kalt pürieren.' }] },
      { titel: 'Backen', zutaten: [],
        schritte: [
          { t: 'Ofen vorheizen', x: 'Backofen auf Höchststufe vorheizen, ca. 250–270 °C.' },
          { t: 'Ausrollen & belegen', x: 'Teig ca. 4 mm dünn ausrollen oder ziehen, Sauce dünn und kreisförmig verteilen und nach Wunsch belegen.' },
          { t: 'Backen', x: 'Im heißen Ofen backen, bis der Rand goldbraun ist.', z: '7–12 Min.' }
        ] }
    ],
    tipps: ['Teigkugeln lassen sich bis zu 1 Monat einfrieren und tauen in 1–2 Std. bei Raumtemperatur auf.', 'Hefe-Test: etwas Hefe mit Zucker in lauwarmem Wasser auflösen – blubbert es nach 5–10 Min., ist sie aktiv.', 'Ein Handrührgerät kann beim 20-Minuten-Kneten heiß werden, besser eine Küchenmaschine.']
  },
  {
    id: 'knoedel', titel: 'Semmelknödel aus der Springform', kategorie: 'Bayerisch', bild: 'img/knoedel.svg', emoji: '🥖',
    farbe: ['#6b5a2e', '#d8c48a'], portionen: '4 Portionen', zeit: '50 Min.',
    teaser: 'Ein komplettes Essen: Die Knödelmasse wird luftig mit Eischnee aufgelockert und im Ofen gebacken – dazu eine cremige Pilzsahnesauce, die fertig ist, wenn die Knödel aus dem Ofen kommen.',
    tags: ['vegetarisch', 'Familie'],
    abschnitte: [{
      titel: 'Semmelknödel', zutaten: [['300 g', 'Brötchen / Brot'], ['1', 'Zwiebel, gewürfelt'], ['1 Bund', 'Petersilie'], ['¼ l', 'Milch'], ['3', 'Eier (getrennt)'], ['', 'Salz & Pfeffer'], ['', 'Butter'], ['', 'Muskat']],
      schritte: [
        { t: 'Ofen vorheizen', x: 'Ofen auf 200 °C vorheizen. Springform gut buttern.' },
        { t: 'Brötchen würfeln', x: 'Brötchen oder Brot in kleine Würfel schneiden.' },
        { t: 'Zwiebeln andünsten', x: 'Zwiebelwürfel in Butter glasig andünsten.' },
        { t: 'Masse anrühren', x: '3 Eigelb mit Milch, Salz, Pfeffer, Muskat und gehackter Petersilie vermengen. Brötchenwürfel und Zwiebeln untermischen und ziehen lassen.' },
        { t: 'Eiweiß unterheben', x: 'Eiweiß steif schlagen und vorsichtig unter die Masse heben.' },
        { t: 'Backen', x: 'Masse in die Springform füllen und im vorgeheizten Ofen backen.', z: '30 Min.' }
      ]
    },
      { titel: 'Pilzsahnesauce', zutaten: [['500 g', 'Braune Champignons'], ['1', 'Zwiebel'], ['1', 'Knoblauchzehe'], ['2 EL', 'Butter oder Olivenöl'], ['150 ml', 'Gemüsebrühe'], ['200 ml', 'Sahne'], ['', 'Salz & Pfeffer'], ['', 'Petersilie']],
        schritte: [
          { t: 'Pilze vorbereiten', x: 'Während die Knödel backen: Champignons putzen und in Scheiben schneiden, Zwiebel und Knoblauch fein würfeln.' },
          { t: 'Pilze anbraten', x: 'Butter oder Öl erhitzen, Zwiebel und Knoblauch glasig dünsten, dann die Pilze bei hoher Hitze goldbraun anbraten.', z: '8 Min.' },
          { t: 'Sauce köcheln', x: 'Mit Gemüsebrühe ablöschen, Sahne dazugeben und leicht eindicken lassen. Kräftig mit Salz und Pfeffer abschmecken.', z: '5 Min.' },
          { t: 'Servieren', x: 'Knödel aus der Form in Stücke schneiden, mit reichlich Pilzsahnesauce und gehackter Petersilie anrichten.' }
        ] }]
  },
  {
    id: 'wraps', titel: 'Tortilla Wraps', kategorie: 'Mexikanisch', emoji: '🌯',
    farbe: ['#8c6b2f', '#ecd39a'], portionen: 'ca. 8 Wraps', zeit: '40 Min.',
    teaser: 'Fünf Zutaten, eine heiße Pfanne: Selbstgemachte Tortillas sind weicher und aromatischer als alles aus der Packung.',
    tags: ['vegan', 'Familie'],
    abschnitte: [{
      zutaten: [['375 g', 'Mehl'], ['1 TL', 'Backpulver'], ['1 TL', 'Salz'], ['50 ml', 'Olivenöl'], ['240 ml', 'Warmes Wasser']],
      schritte: [
        { t: 'Teig machen', x: 'Alle Zutaten vermengen und zu einem glatten Teig kneten.' },
        { t: 'Ruhen lassen', x: 'Teig abgedeckt ruhen lassen.', z: '15 Min.' },
        { t: 'Portionieren & ausrollen', x: 'Teig in ca. 8 gleich große Kugeln teilen und dünn ausrollen.' },
        { t: 'In der Pfanne backen', x: 'Jede Tortilla in einer heißen, unbeschichteten Pfanne ohne Fett von jeder Seite kurz backen, bis sich braune Flecken bilden.' },
        { t: 'Warm halten', x: 'Fertige Wraps sofort in ein feuchtes Tuch wickeln, damit sie weich und geschmeidig bleiben.' }
      ]
    }]
  },
  {
    id: 'caesar', titel: 'Caesar Salat', kategorie: 'Amerikanisch', emoji: '🥗',
    farbe: ['#3f6b2a', '#b9d98a'], portionen: '4 Portionen', zeit: '35 Min.',
    teaser: 'Knackige Romana-Herzen, cremiges Dressing mit Parmesan, Knoblauch-Croutons aus dem Ofen und goldbraun gebratenes Hähnchen.',
    tags: ['Hähnchen', 'Familie'],
    abschnitte: [
      { titel: 'Caesar Dressing', zutaten: [['1', 'Knoblauchzehe'], ['1 TL', 'Senf'], ['3 EL', 'Mayonnaise'], ['2 EL', 'Zitronensaft'], ['80 ml', 'Olivenöl'], ['2 EL', 'Parmesan, frisch gerieben'], ['', 'Salz & Pfeffer']],
        schritte: [{ t: 'Dressing rühren', x: 'Knoblauch fein reiben, mit Senf, Mayo und Zitronensaft verrühren. Olivenöl einrühren, bis es cremig ist, Parmesan unterrühren und abschmecken.' }] },
      { titel: 'Croutons', zutaten: [['3–4 Scheiben', 'Weißbrot / Baguette'], ['2 EL', 'Olivenöl'], ['1', 'Knoblauchzehe'], ['', 'Salz']],
        schritte: [{ t: 'Rösten', x: 'Brot würfeln, mit Olivenöl und geriebenem Knoblauch vermengen und bei 180 °C im Ofen goldbraun rösten.', z: '10 Min.' }] },
      { titel: 'Hähnchen', zutaten: [['2', 'Hähnchenbrustfilets'], ['1 EL', 'Olivenöl'], ['', 'Salz, Pfeffer, Paprikapulver']],
        schritte: [{ t: 'Braten', x: 'Filets mit den Gewürzen einreiben und in der heißen Pfanne goldbraun braten. Kurz ruhen lassen, dann in Streifen schneiden.', z: '4–5 Min./Seite' }] },
      { titel: 'Salat', zutaten: [['2', 'Romana-Salatherzen'], ['60 g', 'Parmesan, gehobelt']],
        schritte: [{ t: 'Zusammenstellen', x: 'Salatblätter grob zupfen, mit dem Dressing vermengen, Hähnchenstreifen, Croutons und Parmesan darüber – sofort servieren.' }] }
    ]
  },
  {
    id: 'kuerbis', titel: 'Einfache Kürbissuppe', kategorie: 'Deutsch', bild: 'img/kuerbis.svg', emoji: '🎃',
    farbe: ['#b8560f', '#f7b04a'], portionen: '4 Portionen', zeit: '35 Min.',
    teaser: 'Samtig, wärmend und in einer halben Stunde fertig: Hokkaido muss nicht geschält werden – ein Schuss Sahne und geröstete Kerne obendrauf.',
    tags: ['vegetarisch', 'Herbst'],
    abschnitte: [{
      zutaten: [['1 (ca. 1 kg)', 'Hokkaido-Kürbis'], ['1', 'Zwiebel'], ['1', 'Knoblauchzehe'], ['2', 'Karotten'], ['1 EL', 'Butter oder Olivenöl'], ['800 ml', 'Gemüsebrühe'], ['100 ml', 'Sahne (oder Kokosmilch)'], ['', 'Salz, Pfeffer, Muskat'], ['2 EL', 'Kürbiskerne zum Bestreuen']],
      schritte: [
        { t: 'Gemüse schneiden', x: 'Kürbis waschen, halbieren, Kerne entfernen und samt Schale in Würfel schneiden. Zwiebel, Knoblauch und Karotten schälen und klein schneiden.' },
        { t: 'Andünsten', x: 'Butter oder Öl im Topf erhitzen, Zwiebel und Knoblauch glasig dünsten, dann Kürbis und Karotten kurz mitdünsten.', z: '5 Min.' },
        { t: 'Köcheln', x: 'Mit Gemüsebrühe ablöschen und zugedeckt köcheln, bis der Kürbis weich ist.', z: '20 Min.' },
        { t: 'Pürieren', x: 'Mit dem Stabmixer fein pürieren, Sahne einrühren und mit Salz, Pfeffer und etwas Muskat abschmecken.' },
        { t: 'Kerne rösten', x: 'Kürbiskerne in einer Pfanne ohne Fett kurz anrösten, bis sie duften.', z: '2–3 Min.' },
        { t: 'Servieren', x: 'Suppe in Teller füllen, einen Klecks Sahne hineinziehen und mit Kürbiskernen bestreuen.' }
      ]
    }],
    tipps: ['Hokkaido-Schale wird beim Kochen weich und kann mitpüriert werden.', 'Mit Kokosmilch und einem Stück Ingwer wird die Suppe asiatisch – und vegan.', 'Ein paar Tropfen Kürbiskernöl zum Schluss machen sie besonders.']
  },
  {
    id: 'ziegenkaese', titel: 'Salat mit gebackenem Ziegenkäse', kategorie: 'Französisch', bild: 'img/ziegenkaese.svg', emoji: '🥗',
    farbe: ['#4a6a2a', '#d6d88a'], portionen: '4 Portionen', zeit: '25 Min.',
    teaser: 'Warmer, cremiger Ziegenkäse auf knusprigem Baguette, mit Honig und Thymian überbacken – auf knackigem Salat mit Birne, Walnüssen und Balsamico-Dressing.',
    tags: ['vegetarisch', 'Salat', 'Gäste'],
    abschnitte: [
      { titel: 'Gebackener Ziegenkäse', zutaten: [['2 Rollen (à 150 g)', 'Ziegenkäse (Ziegenfrischkäse-Rolle)'], ['8 Scheiben', 'Baguette'], ['2 EL', 'Honig'], ['2 Zweige', 'Thymian'], ['1 EL', 'Olivenöl'], ['', 'Pfeffer']],
        schritte: [
          { t: 'Ofen vorheizen', x: 'Ofen auf 220 °C Ober-/Unterhitze (oder Grillfunktion) vorheizen.' },
          { t: 'Belegen', x: 'Baguettescheiben mit Olivenöl beträufeln, Ziegenkäse in 8 dicke Scheiben schneiden und je eine auf das Brot legen. Mit Honig beträufeln, Thymianblättchen und Pfeffer darüberstreuen.' },
          { t: 'Überbacken', x: 'Auf mittlerer Schiene backen, bis der Käse weich wird und leicht Farbe bekommt.', z: '6–8 Min.' }
        ] },
      { titel: 'Salat & Dressing', zutaten: [['150 g', 'Feldsalat oder Rucola'], ['1', 'Kleiner Radicchio oder Romana-Herz'], ['1', 'Birne'], ['50 g', 'Walnüsse'], ['3 EL', 'Olivenöl'], ['2 EL', 'Balsamico'], ['1 TL', 'Honig'], ['1 TL', 'Senf'], ['', 'Salz & Pfeffer']],
        schritte: [
          { t: 'Walnüsse rösten', x: 'Walnüsse grob hacken und in einer Pfanne ohne Fett rösten, bis sie duften.', z: '3 Min.' },
          { t: 'Salat vorbereiten', x: 'Salat waschen und trocken schleudern, Radicchio in Streifen schneiden. Birne vierteln, entkernen und in dünne Spalten schneiden.' },
          { t: 'Dressing rühren', x: 'Olivenöl, Balsamico, Honig und Senf verrühren und mit Salz und Pfeffer abschmecken.' },
          { t: 'Anrichten', x: 'Salat mit dem Dressing vermengen, auf Tellern verteilen, Birnenspalten und Walnüsse darauf und je zwei warme Ziegenkäse-Taler obenauf setzen. Sofort servieren.' }
        ] }
    ],
    tipps: ['Ziegenkäse vor dem Schneiden kurz ins Gefrierfach legen – dann lässt er sich sauber in Scheiben schneiden.', 'Statt Birne passen auch frische Feigen oder Weintrauben.', 'Ein paar Granatapfelkerne machen den Salat festlich.']
  },
  {
    id: 'kartoffelsalat', titel: 'Bayerischer Kartoffelsalat', kategorie: 'Bayerisch', bild: 'img/kartoffelsalat.svg', emoji: '🥔',
    farbe: ['#2f5f8f', '#e8d88a'], portionen: '4 Portionen', zeit: '45 Min. + 30 Min. ziehen',
    teaser: 'Ohne Mayo, dafür mit heißer Brühe, Essig und Zwiebeln angemacht, bis er schlonzig-glänzend ist – der Klassiker zu Leberkäs, Schnitzel und Weißwurst.',
    tags: ['vegetarisch', 'Klassiker', 'Grillen'],
    abschnitte: [{
      zutaten: [['1 kg', 'Kartoffeln, festkochend'], ['1', 'Zwiebel'], ['250 ml', 'Gemüse- oder Rinderbrühe'], ['4 EL', 'Weißweinessig'], ['1 TL', 'Senf'], ['1 TL', 'Zucker'], ['5 EL', 'Sonnenblumenöl'], ['1 Bund', 'Schnittlauch'], ['', 'Salz & Pfeffer']],
      schritte: [
        { t: 'Kartoffeln kochen', x: 'Kartoffeln mit Schale in Salzwasser garen, bis sie gerade weich sind.', z: '20–25 Min.' },
        { t: 'Pellen & schneiden', x: 'Abgießen, kurz ausdampfen lassen und noch warm pellen. In dünne Scheiben schneiden und in eine große Schüssel geben.' },
        { t: 'Marinade kochen', x: 'Zwiebel sehr fein würfeln und mit Brühe, Essig, Senf, Zucker, Salz und Pfeffer aufkochen.', z: '2 Min.' },
        { t: 'Übergießen', x: 'Die heiße Marinade über die warmen Kartoffeln gießen und vorsichtig unterheben. Die Kartoffeln saugen die Brühe auf.' },
        { t: 'Ziehen lassen', x: 'Abgedeckt ziehen lassen, zwischendurch vorsichtig durchmischen.', z: '30 Min.' },
        { t: 'Öl & Schnittlauch', x: 'Erst jetzt das Öl unterheben, bis der Salat schön glänzt und leicht sämig ist. Nochmals abschmecken und mit Schnittlauchröllchen bestreuen.' }
      ]
    }],
    tipps: ['Kartoffeln warm anmachen – nur dann nehmen sie die Marinade richtig auf.', 'Ist der Salat zu trocken, einfach noch einen Schuss heiße Brühe dazu.', 'Lauwarm schmeckt er am besten. Variante: ein paar Speckwürfel mit den Zwiebeln anbraten.']
  },
  {
    id: "currysuppe",
    titel: "Thai-Curry-Kokossuppe mit Zitronengras",
    kategorie: "Thailändisch",
    bild: "img/currysuppe.svg",
    emoji: "🍜",
    farbe: ["#b8621e", "#f7d08a"],
    portionen: "4 Portionen",
    zeit: "35 Min.",
    teaser: "Cremig-trüb von reichlich Kokosmilch, aromatisch von Zitronengras, Ingwer und roter Currypaste – mit zartem Hähnchen, Champignons, Limette und frischem Koriander.",
    tags: ["asiatisch", "Familie", "wärmend"],
    abschnitte: [{"titel": "Suppe", "zutaten": [["2 Stangen", "Zitronengras"], ["1 Stück (4 cm)", "Ingwer oder Galgant"], ["2", "Knoblauchzehen"], ["2", "Schalotten"], ["2 EL", "Rote Currypaste"], ["1 EL", "Kokos- oder Pflanzenöl"], ["2 Dosen (à 400 ml)", "Kokosmilch (vollfett)"], ["500 ml", "Hühner- oder Gemüsebrühe"], ["4", "Kaffir-Limettenblätter (optional)"], ["400 g", "Hähnchenbrust"], ["200 g", "Champignons"], ["1", "Rote Paprika"], ["2 EL", "Fischsauce (oder Sojasauce)"], ["1 TL", "Zucker"], ["1", "Limette (Saft)"]], "schritte": [{"t": "Aromaten vorbereiten", "x": "Zitronengras von den äußeren Blättern befreien, mit dem Messerrücken flach klopfen und in 5 cm lange Stücke schneiden. Ingwer in dünne Scheiben, Knoblauch und Schalotten fein hacken."}, {"t": "Currypaste anrösten", "x": "Öl im Topf erhitzen, Schalotten, Knoblauch und Ingwer kurz andünsten, dann die Currypaste dazugeben und unter Rühren rösten, bis sie duftet.", "z": "2 Min."}, {"t": "Kokosmilch & Brühe", "x": "Die Kokosmilch gut schütteln, damit Creme und Wasser sich verbinden, und mit der Brühe angießen. Zitronengras und Limettenblätter dazugeben und leise köcheln lassen – nicht sprudelnd kochen, sonst flockt die Kokosmilch aus.", "z": "10 Min."}, {"t": "Einlage garen", "x": "Hähnchen in dünne Streifen schneiden, Champignons in Scheiben, Paprika in Streifen. Alles in die Suppe geben und gar ziehen lassen.", "z": "8 Min."}, {"t": "Abschmecken", "x": "Mit Fischsauce, Zucker und Limettensaft abschmecken – die Suppe soll gleichzeitig salzig, leicht süß, sauer und etwas scharf sein. Zitronengras und Limettenblätter vor dem Servieren herausfischen."}, {"t": "Servieren", "x": "In Schalen füllen und mit Koriander, Frühlingszwiebeln, Chiliringen und einer Limettenspalte servieren."}]}, {"titel": "Zum Servieren", "zutaten": [["1 Bund", "Frischer Koriander"], ["2", "Frühlingszwiebeln"], ["1", "Rote Chili"], ["1", "Limette"], ["", "Jasminreis oder Reisnudeln (optional)"]], "schritte": [{"t": "Sattmacher", "x": "Wer es als Hauptgericht möchte, gibt gekochte Reisnudeln in die Schalen oder serviert Jasminreis dazu."}]}],
    tipps: ["Unbedingt vollfette Kokosmilch nehmen – nur die macht die Suppe schön trüb und cremig.", "Zitronengras gibt Aroma, wird aber nicht mitgegessen: grob lassen, dann findet man es leicht wieder.", "Vegetarisch mit Tofu, Gemüsebrühe und Sojasauce statt Fischsauce."]
  },
  {
    id: 'gazpacho', titel: 'Gazpacho', kategorie: 'Spanisch', bild: 'img/gazpacho.svg', emoji: '🍅',
    farbe: ['#b3261e', '#f39a7b'], portionen: '4 Portionen', zeit: '20 Min. + 2–3 Std. kühlen',
    teaser: 'Die klassische kalte Tomatensuppe aus Andalusien – erfrischend an heißen Tagen, am zweiten Tag noch besser.',
    tags: ['vegan', 'Sommer', 'spanisch'],
    abschnitte: [
      { titel: 'Suppe', zutaten: [['1 kg', 'Reife Fleischtomaten'], ['1', 'Grüne (Spitz-)Paprika'], ['½', 'Salatgurke'], ['1 kleine', 'Knoblauchzehe'], ['50 g', 'Altbackenes Weißbrot'], ['100–120 ml', 'Olivenöl extra vergine'], ['1 TL', 'Salz'], ['nach Bedarf', 'Kaltes Wasser']],
        schritte: [
          { t: 'Einweichen & schneiden', x: 'Brot kurz in etwas Wasser einweichen. Tomaten, Paprika, Gurke und Knoblauch grob schneiden.' },
          { t: 'Pürieren', x: 'Alles mit dem ausgedrückten Brot und Salz fein pürieren. Bei laufendem Mixer das Olivenöl langsam einlaufen lassen, bis es cremig emulgiert.' },
          { t: 'Passieren', x: 'Für eine ganz feine Konsistenz durch ein Sieb streichen und mit Wasser auf die gewünschte Dicke bringen.' },
          { t: 'Kühlen', x: 'Abschmecken und gut durchkühlen lassen.', z: '2–3 Std.' }
        ] },
      { titel: 'Topping (optional)', zutaten: [['etwas', 'Gurke, Paprika & Tomate, fein gewürfelt'], ['', 'Knusprige Croutons'], ['', 'Ein Schuss Olivenöl']],
        schritte: [{ t: 'Servieren', x: 'Eiskalt in Schälchen oder Gläsern servieren, Topping darüber.' }] }
    ],
    tipps: ['Tomaten so reif wie möglich – je reifer, desto weniger muss man würzen.', 'Grüner Paprika ist original, roter macht es süßer.', 'Ohne Essig schmeckt es milder – bei Bedarf ein Spritzer Zitronensaft.', 'Hält gekühlt 2–3 Tage.']
  },
  {
    id: 'pfannkuchen', titel: 'Pfannkuchen mit Apfelmus', kategorie: 'Deutsch', bild: 'img/pfannkuchen.svg', emoji: '🥞',
    farbe: ['#b38a14', '#f7e27a'], portionen: 'ca. 8 Pfannkuchen', zeit: '30 Min.',
    teaser: 'Dünne, goldene Pfannkuchen mit einem Hauch Zitronenabrieb im Teig – dazu reichlich Apfelmus und eine Prise Zimt und Zucker. Der Familienklassiker.',
    tags: ['vegetarisch', 'Familie', 'süß'],
    abschnitte: [{
      zutaten: [['250 g', 'Mehl'], ['500 ml', 'Milch'], ['3', 'Eier'], ['1 EL', 'Zucker'], ['1 Prise', 'Salz'], ['1', 'Bio-Zitrone (Abrieb)'], ['', 'Butter zum Ausbacken'], ['', 'Zucker oder Puderzucker zum Bestreuen'], ['1 Glas (700 g)', 'Apfelmus'], ['', 'Zimt']],
      schritte: [
        { t: 'Teig rühren', x: 'Mehl, Milch, Eier, Zucker und Salz zu einem glatten Teig verrühren.' },
        { t: 'Zitrone abreiben', x: 'Zitrone heiß waschen, die gelbe Schale fein abreiben und unter den Teig rühren.' },
        { t: 'Ruhen lassen', x: 'Teig kurz quellen lassen, dann wird er geschmeidiger.', z: '10 Min.' },
        { t: 'Ausbacken', x: 'Etwas Butter in einer Pfanne erhitzen, eine Kelle Teig hineingeben und durch Schwenken dünn verteilen. Von beiden Seiten goldbraun backen.', z: '1–2 Min./Seite' },
        { t: 'Servieren', x: 'Pfannkuchen mit Zimt und Zucker bestreuen, nach Wunsch aufrollen und mit einer großen Portion Apfelmus servieren.' }
      ]
    }],
    tipps: ['Nur die gelbe Schale abreiben – das Weiße darunter ist bitter.', 'Fertige Pfannkuchen im Ofen bei 80 °C warm halten.', 'Ein Schuss Mineralwasser im Teig macht sie besonders luftig.']
  },
  {
    id: 'broetchen', titel: 'Übernacht-Brötchen', kategorie: 'Deutsch', bild: 'img/broetchen.svg', emoji: '🥖',
    farbe: ['#8a5a1e', '#ecc98a'], portionen: '10 Brötchen', zeit: '20 Min. am Abend + 25 Min. am Morgen',
    teaser: 'Abends in zehn Minuten angerührt, über Nacht im Kühlschrank gereift, morgens direkt in den Ofen: knusprige Sonntagsbrötchen ohne Wecker um sechs.',
    tags: ['vegan', 'Frühstück', 'Sonntag'],
    abschnitte: [
      { titel: 'Am Abend', zutaten: [['500 g', 'Weizenmehl Type 550'], ['350 ml', 'Kaltes Wasser'], ['5 g', 'Frische Hefe (⅛ Würfel)'], ['10 g', 'Salz'], ['1 TL', 'Honig oder Zucker']],
        schritte: [
          { t: 'Hefe auflösen', x: 'Hefe und Honig im kalten Wasser auflösen.' },
          { t: 'Teig rühren', x: 'Mehl und Salz dazugeben und mit der Küchenmaschine oder den Knethaken zu einem weichen, leicht klebrigen Teig kneten.', z: '5–8 Min.' },
          { t: 'Formen', x: 'Teig auf der bemehlten Arbeitsfläche in 10 Stücke teilen, rund schleifen und mit Abstand auf ein Blech mit Backpapier setzen.' },
          { t: 'Über Nacht kühlen', x: 'Blech mit Frischhaltefolie oder einer großen Tüte abdecken und in den Kühlschrank stellen. Die Hefe arbeitet langsam weiter und bringt Aroma.', z: '8–12 Std.' }
        ] },
      { titel: 'Am Morgen', zutaten: [['', 'Wasser zum Besprühen'], ['', 'Mehl, Sesam oder Mohn (optional)']],
        schritte: [
          { t: 'Ofen vorheizen', x: 'Ofen auf 230 °C Ober-/Unterhitze vorheizen, eine ofenfeste Schale mit Wasser auf den Boden stellen. Die Brötchen bleiben solange im Kühlschrank.', z: '10 Min.' },
          { t: 'Einschneiden', x: 'Brötchen direkt aus dem Kühlschrank mit Wasser besprühen, nach Wunsch mit Mehl, Sesam oder Mohn bestreuen und mit einem scharfen Messer einschneiden.' },
          { t: 'Backen', x: 'Auf mittlerer Schiene goldbraun backen. Nach 10 Minuten die Wasserschale herausnehmen, damit die Kruste knusprig wird.', z: '18–20 Min.' },
          { t: 'Abkühlen', x: 'Kurz auf einem Gitter abkühlen lassen – dann knackt die Kruste.' }
        ] }
    ],
    tipps: ['Der Teig verträgt bis zu 24 Std. im Kühlschrank – ideal, wenn es morgens später wird.', 'Für Körnerbrötchen 100 g Mehl durch eine Körnermischung ersetzen und 30 ml mehr Wasser nehmen.', 'Nicht vorher aus dem Kühlschrank nehmen: kalt eingeschoben reißen sie schöner auf.']
  },
  {
    id: 'kaesestangen', titel: 'Türkische Käsestangen aus Blätterteig', kategorie: 'Türkisch', bild: 'img/boerek.svg', emoji: '🥐',
    farbe: ['#9a5a14', '#f3c874'], portionen: 'ca. 20 Stangen', zeit: '35 Min.',
    teaser: 'Knuspriger Blätterteig, gefüllt mit Schafskäse und Petersilie, gedreht und mit Schwarzkümmel und Sesam bestreut – wie vom türkischen Bäcker um die Ecke.',
    tags: ['vegetarisch', 'Fingerfood', 'Party'],
    abschnitte: [
      { titel: 'Füllung', zutaten: [['200 g', 'Schafskäse (Beyaz Peynir oder Feta)'], ['½ Bund', 'Glatte Petersilie'], ['1', 'Eiweiß'], ['', 'Pfeffer, Pul Biber (optional)']],
        schritte: [
          { t: 'Käse zerbröseln', x: 'Schafskäse mit einer Gabel fein zerdrücken. Petersilie fein hacken und mit dem Eiweiß untermischen, mit Pfeffer und nach Wunsch Pul Biber würzen.' }
        ] },
      { titel: 'Stangen & Topping', zutaten: [['2 Rollen (à 275 g)', 'Blätterteig aus dem Kühlregal'], ['1', 'Eigelb'], ['1 EL', 'Milch'], ['1 EL', 'Schwarzkümmel (Çörek Otu)'], ['1 EL', 'Sesam']],
        schritte: [
          { t: 'Ofen vorheizen', x: 'Ofen auf 200 °C Ober-/Unterhitze vorheizen, ein Blech mit Backpapier belegen.' },
          { t: 'Füllung verteilen', x: 'Eine Blätterteigrolle ausrollen, die Füllung gleichmäßig daraufstreichen und mit der zweiten Teigplatte bedecken. Leicht andrücken.' },
          { t: 'Schneiden & drehen', x: 'Mit einem Pizzaschneider in ca. 2 cm breite Streifen schneiden. Jeden Streifen an den Enden fassen und 2–3 Mal eindrehen.' },
          { t: 'Bestreichen', x: 'Stangen aufs Blech legen, Eigelb mit Milch verquirlen, die Stangen damit bestreichen und mit Schwarzkümmel und Sesam bestreuen.' },
          { t: 'Backen', x: 'Goldbraun und knusprig backen.', z: '15–18 Min.' }
        ] }
    ],
    tipps: ['Blätterteig gut gekühlt verarbeiten, dann lässt er sich sauber drehen.', 'Schmecken warm am besten, lassen sich aber auch prima vorbereiten und kurz aufbacken.', 'Variante: statt Petersilie etwas Minze oder Spinat in die Füllung.']
  },
  {
    id: "pide",
    titel: "Orientalisches Fladenbrot (Pide)",
    kategorie: "Türkisch",
    bild: "img/pide.svg",
    emoji: "🫓",
    farbe: ["#9a5a16", "#f2c46a"],
    portionen: "2 Fladen",
    zeit: "30 Min. + 1,5 Std. gehen",
    teaser: "Das weiche, luftige Fladenbrot wie vom türkischen Bäcker: mit dem typischen Rautenmuster, glänzender Eigelb-Joghurt-Glasur, Sesam und Schwarzkümmel – noch warm einfach unschlagbar.",
    tags: ["Backen", "Beilage", "Grillen"],
    abschnitte: [{"titel": "Teig", "zutaten": [["500 g", "Weizenmehl Type 550"], ["330 ml", "Lauwarmes Wasser"], ["½ Würfel (20 g)", "Frische Hefe"], ["1 TL", "Zucker"], ["1,5 TL", "Salz"], ["3 EL", "Olivenöl"]], "schritte": [{"t": "Hefe auflösen", "x": "Hefe und Zucker im lauwarmen Wasser auflösen."}, {"t": "Teig kneten", "x": "Mit Mehl, Salz und Olivenöl zu einem weichen, leicht klebrigen Teig kneten – er darf ruhig weicher sein als ein Brotteig.", "z": "8–10 Min."}, {"t": "Gehen lassen", "x": "Abgedeckt an einem warmen Ort gehen lassen, bis er sich deutlich vergrößert hat.", "z": "1 Std."}, {"t": "Fladen formen", "x": "Teig halbieren, jede Hälfte auf einem Blech mit Backpapier mit geölten Händen zu einem ovalen Fladen von ca. 2 cm Dicke drücken. Nochmals abgedeckt ruhen lassen.", "z": "30 Min."}]}, {"titel": "Glasur & Topping", "zutaten": [["1", "Eigelb"], ["1 EL", "Joghurt"], ["1 EL", "Olivenöl"], ["1 EL", "Sesam"], ["1 TL", "Schwarzkümmel (Çörek Otu)"]], "schritte": [{"t": "Ofen vorheizen", "x": "Ofen auf 230 °C Ober-/Unterhitze vorheizen."}, {"t": "Glasur rühren", "x": "Eigelb, Joghurt und Olivenöl verrühren."}, {"t": "Rautenmuster", "x": "Fladen mit der Glasur bestreichen. Mit geölten Fingerspitzen einen Rand frei lassen und innen tiefe Rillen längs und schräg eindrücken, sodass ein Rautenmuster entsteht."}, {"t": "Bestreuen & backen", "x": "Mit Sesam und Schwarzkümmel bestreuen und goldbraun backen.", "z": "12–15 Min."}, {"t": "Weich halten", "x": "Direkt nach dem Backen in ein sauberes Küchentuch wickeln – so bleibt die Kruste weich."}]}],
    tipps: ["Der weiche Teig ist das Geheimnis – nicht zu viel Mehl einarbeiten.", "Die Rillen richtig tief eindrücken, sonst verschwindet das Muster beim Backen.", "Passt zu Köfte, Hummus, Baba Ganoush und allen Suppen."]
  },
  {
    id: "macarons",
    titel: "Bunte Macarons",
    kategorie: "Französisch",
    bild: "img/macarons.svg",
    emoji: "🍬",
    farbe: ["#c86a9a", "#f7c8dc"],
    portionen: "ca. 30 Macarons",
    zeit: "1 Std. + 30 Min. trocknen + 1 Tag durchziehen",
    teaser: "Zarte Mandelschalen in Rosa, Pistaziengrün, Zitronengelb, Lavendel und Himmelblau – knusprig außen, weich innen, gefüllt mit weißer Schokoladen-Ganache.",
    tags: ["Backen", "süß", "Wochenende"],
    abschnitte: [{"titel": "Schalen", "zutaten": [["100 g", "Blanchiertes Mandelmehl (sehr fein)"], ["100 g", "Puderzucker"], ["75 g", "Eiweiß (ca. 2–3 Eier, Zimmertemperatur)"], ["75 g", "Zucker"], ["1 Prise", "Salz"], ["", "Gel-Lebensmittelfarben (Rosa, Grün, Gelb, Lila, Blau)"]], "schritte": [{"t": "Mandeln sieben", "x": "Mandelmehl und Puderzucker zusammen kurz im Mixer mahlen und durch ein feines Sieb streichen. Grobe Reste wegwerfen."}, {"t": "Baiser schlagen", "x": "Eiweiß mit Salz halbsteif schlagen, dann den Zucker langsam einrieseln lassen und zu einem festen, glänzenden Eischnee schlagen, der Spitzen hält.", "z": "5–8 Min."}, {"t": "Einfärben", "x": "Den Eischnee auf so viele Schüsseln verteilen, wie Farben gewünscht sind, und jeweils mit einer Messerspitze Gelfarbe kräftig einfärben – beim Backen verblasst sie etwas."}, {"t": "Makronieren", "x": "Die Mandelmischung anteilig auf die Schüsseln verteilen und mit dem Teigschaber unterheben, dabei die Masse immer wieder an der Schüsselwand flach streichen. Fertig ist sie, wenn sie wie Lava vom Schaber fließt und eine Acht malen lässt, ohne abzureißen."}, {"t": "Aufspritzen", "x": "Jede Farbe in einen Spritzbeutel mit runder Tülle füllen und 3 cm große Kreise mit Abstand auf Backpapier oder eine Silikonmatte spritzen. Blech kräftig auf die Arbeitsfläche klopfen, Luftblasen mit einem Zahnstocher aufstechen."}, {"t": "Trocknen lassen", "x": "Bei Raumtemperatur trocknen lassen, bis sich eine Haut bildet und die Oberfläche beim Antippen nicht mehr klebt.", "z": "30–60 Min."}, {"t": "Backen", "x": "Im vorgeheizten Ofen bei 145 °C Umluft backen, bis sich die typischen Füßchen gebildet haben. Vollständig auf dem Blech abkühlen lassen, dann vorsichtig ablösen.", "z": "14–16 Min."}]}, {"titel": "Füllung", "zutaten": [["150 g", "Weiße Schokolade"], ["60 ml", "Sahne"], ["20 g", "Butter"], ["", "Aroma nach Wunsch: Himbeere, Pistazie, Zitronenabrieb, Vanille"]], "schritte": [{"t": "Ganache kochen", "x": "Sahne aufkochen, über die gehackte Schokolade gießen, kurz stehen lassen und mit der Butter glatt rühren. Nach Wunsch aufteilen und aromatisieren."}, {"t": "Fest werden lassen", "x": "Abgedeckt im Kühlschrank fest werden lassen, bis sie spritzfähig ist.", "z": "1 Std."}, {"t": "Füllen", "x": "Gleich große Schalen paaren, auf eine Hälfte einen Tupfen Ganache spritzen und die zweite Schale sanft aufdrehen."}, {"t": "Durchziehen", "x": "Die Macarons in einer Dose im Kühlschrank einen Tag reifen lassen – erst dann werden sie innen schön weich. 20 Minuten vor dem Servieren herausnehmen.", "z": "24 Std."}]}],
    tipps: ["Eiweiß am besten 1–2 Tage vorher trennen und abgedeckt stehen lassen – gealtertes Eiweiß gibt stabileren Schnee.", "Nur Gel- oder Pulverfarben verwenden, flüssige Farbe macht die Masse zu weich.", "Unbedingt eine Küchenwaage nutzen – bei Macarons zählt jedes Gramm.", "Der Ofen ist entscheidend: bei Rissen etwas niedriger backen, bei fehlenden Füßchen länger trocknen lassen."]
  },
  {
    id: "plaetzchen",
    titel: "Plätzchen mit Zuckerguss und Streuseln",
    kategorie: "Deutsch",
    bild: "img/plaetzchen.svg",
    emoji: "⭐",
    farbe: ["#c85a7a", "#f8d0dc"],
    portionen: "ca. 50 Plätzchen",
    zeit: "1,5 Std. + 1 Std. kühlen",
    teaser: "Mürbe Butterplätzchen zum Ausstechen – Sterne, Herzen, Kreise – mit buntem Zuckerguss und Zuckerstreuseln verziert. Das Backprojekt für die ganze Familie.",
    tags: ["Weihnachten", "Backen", "Kinder"],
    abschnitte: [{"titel": "Mürbeteig", "zutaten": [["300 g", "Mehl"], ["200 g", "Kalte Butter"], ["100 g", "Zucker"], ["1 Pck.", "Vanillezucker"], ["1", "Ei"], ["1 Prise", "Salz"], ["", "Abrieb von ½ Bio-Zitrone (optional)"]], "schritte": [{"t": "Teig kneten", "x": "Alle Zutaten zügig zu einem glatten Teig verkneten – nicht zu lange, sonst wird die Butter warm und der Teig brüchig."}, {"t": "Kühlen", "x": "Zu einer flachen Scheibe drücken, in Folie wickeln und kalt stellen.", "z": "1 Std."}, {"t": "Ausrollen & ausstechen", "x": "Portionsweise auf wenig Mehl ca. 4 mm dick ausrollen, Sterne, Herzen und Kreise ausstechen und auf Bleche mit Backpapier legen."}, {"t": "Backen", "x": "Im vorgeheizten Ofen bei 180 °C Ober-/Unterhitze backen, bis die Ränder ganz leicht golden sind.", "z": "8–10 Min."}, {"t": "Abkühlen", "x": "Auf einem Gitter vollständig abkühlen lassen, bevor sie verziert werden."}]}, {"titel": "Zuckerguss & Deko", "zutaten": [["250 g", "Puderzucker"], ["3–4 EL", "Zitronensaft oder Wasser"], ["", "Gel-Lebensmittelfarben"], ["", "Bunte Zuckerstreusel"]], "schritte": [{"t": "Guss anrühren", "x": "Puderzucker nach und nach mit Zitronensaft zu einem dickflüssigen Guss verrühren – er soll langsam vom Löffel laufen."}, {"t": "Einfärben", "x": "Guss auf kleine Schälchen verteilen und mit Gelfarbe in Pastelltönen einfärben."}, {"t": "Verzieren", "x": "Plätzchen mit einem Pinsel oder Teelöffel mit Guss bestreichen und sofort Streusel darüberstreuen, solange der Guss noch feucht ist."}, {"t": "Trocknen", "x": "Liegend trocknen lassen, bis der Guss fest ist. Dann in Blechdosen schichten.", "z": "2 Std."}]}],
    tipps: ["Ausgestochene Plätzchen vor dem Backen 10 Min. auf dem Blech kühlen – dann behalten sie ihre Form.", "Guss lieber zu dick als zu dünn anrühren, verdünnen geht immer.", "In der Blechdose halten sie sich 3–4 Wochen."]
  },
  {
    id: "pfefferkuchen",
    titel: "Richtiger Pfefferkuchen",
    kategorie: "Deutsch",
    bild: "img/pfefferkuchen.svg",
    emoji: "🍪",
    farbe: ["#6a3410", "#d8a06a"],
    portionen: "ca. 40 Stück (1 Blech)",
    zeit: "1 Std. + 2–3 Tage Teigruhe",
    teaser: "Der traditionelle Honigkuchen wie aus der Lausitz und Thüringen: Honigteig mit Roggenmehl, Pottasche und viel Gewürz, der einige Tage ruhen muss – danach saftig, würzig und mit Zuckerguss oder Schokolade überzogen.",
    tags: ["Weihnachten", "Backen", "Tradition"],
    abschnitte: [{"titel": "Honigteig", "zutaten": [["250 g", "Honig"], ["100 g", "Zucker"], ["50 g", "Butter"], ["250 g", "Weizenmehl Type 405"], ["250 g", "Roggenmehl Type 1150"], ["2 TL", "Lebkuchengewürz"], ["1 TL", "Kakao"], ["1", "Ei"], ["1 TL", "Pottasche"], ["1 TL", "Hirschhornsalz"], ["2 EL", "Milch"], ["50 g", "Orangeat oder Zitronat, sehr fein gehackt (optional)"]], "schritte": [{"t": "Honig erwärmen", "x": "Honig, Zucker und Butter in einem Topf erwärmen, bis sich der Zucker gelöst hat – nicht kochen. Lauwarm abkühlen lassen."}, {"t": "Triebmittel lösen", "x": "Pottasche und Hirschhornsalz getrennt in je 1 EL Milch auflösen."}, {"t": "Teig kneten", "x": "Beide Mehle mit Gewürz und Kakao mischen. Honigmasse, Ei, die gelösten Triebmittel und Orangeat dazugeben und zu einem zähen, klebrigen Teig verkneten."}, {"t": "Ruhen lassen", "x": "Teig in Folie wickeln und kühl, aber nicht im Kühlschrank, ruhen lassen. Erst dabei entwickelt er sein Aroma und die typische Konsistenz.", "z": "2–3 Tage"}]}, {"titel": "Backen & Glasieren", "zutaten": [["", "Mehl zum Ausrollen"], ["1", "Eigelb + 1 EL Milch"], ["", "Geschälte Mandelhälften"], ["200 g", "Puderzucker + 3 EL Wasser"], ["150 g", "Zartbitter-Kuvertüre (alternativ)"]], "schritte": [{"t": "Ausrollen", "x": "Teig kurz durchkneten und auf bemehlter Fläche 1 cm dick ausrollen. Rechtecke schneiden oder Herzen ausstechen und auf ein Blech mit Backpapier legen."}, {"t": "Bestreichen", "x": "Mit Eigelb-Milch bestreichen und nach Wunsch mit Mandelhälften belegen."}, {"t": "Backen", "x": "Im vorgeheizten Ofen bei 180 °C Ober-/Unterhitze backen, bis sie aufgegangen und leicht gebräunt sind. Nicht zu lange, sonst werden sie hart.", "z": "15–18 Min."}, {"t": "Glasieren", "x": "Noch warm mit dünnem Zuckerguss bestreichen oder nach dem Abkühlen in geschmolzene Kuvertüre tunken."}, {"t": "Weich werden lassen", "x": "Mit einem Apfelschnitz in einer Blechdose lagern – nach ein paar Tagen werden sie herrlich weich.", "z": "3–5 Tage"}]}],
    tipps: ["Pottasche und Hirschhornsalz gibt es im Backregal zur Weihnachtszeit – sie sind die klassischen Triebmittel für Honigteig und nicht durch Backpulver zu ersetzen.", "Die lange Teigruhe ist kein Muss, aber das Geheimnis des echten Pfefferkuchens.", "Beim Backen riecht Hirschhornsalz nach Ammoniak – das verfliegt vollständig."]
  },
  {
    id: 'hefezopf', titel: 'Hefezopf', kategorie: 'Deutsch', bild: 'img/hefezopf.svg', emoji: '🥐',
    farbe: ['#9a6a1c', '#f3cf7a'], portionen: '1 Zopf', zeit: '2 Std. inkl. Gehzeit',
    teaser: 'Fluffig, leicht zitronig und goldbraun geflochten – der Sonntagsklassiker für den Frühstückstisch.',
    tags: ['Backen', 'Sonntag'],
    abschnitte: [{
      zutaten: [['250 ml', 'Milch'], ['375 g', 'Mehl'], ['60 g', 'Zucker'], ['½ Würfel', 'Frische Hefe'], ['50 g', 'Weiche Butter'], ['1 Prise', 'Salz'], ['1', 'Ei'], ['', 'Zitronenschale']],
      schritte: [
        { t: 'Hefe auflösen', x: 'Milch lauwarm erwärmen (nicht heiß!) und die Hefe darin auflösen.' },
        { t: 'Teig anrühren', x: 'Zucker einrühren, dann Mehl, Butter, Salz, Ei und Zitronenschale dazugeben und zu einem glatten Teig kneten.' },
        { t: 'Gehen lassen', x: 'Teig abgedeckt an einem warmen Ort gehen lassen.', z: 'mind. 1 Std.' },
        { t: 'Zopf flechten', x: 'Teig in 3 Stränge teilen, zu einem Zopf flechten und nochmals ruhen lassen.', z: '30 Min.' },
        { t: 'Backen', x: 'Im vorgeheizten Ofen bei 200 °C goldbraun backen.', z: '15–20 Min.' }
      ]
    }]
  },
  {
    id: 'granola', titel: 'Granola', kategorie: 'Amerikanisch', bild: 'img/granola.svg', emoji: '🥣',
    farbe: ['#7a4e24', '#e3b77a'], portionen: '1 Blech', zeit: '30 Min.',
    teaser: 'Knusprige Haferflocken mit Nüssen, Kokosöl und einem Hauch Zimt – wird beim Abkühlen erst richtig crunchy.',
    tags: ['vegan', 'Frühstück'],
    abschnitte: [{
      zutaten: [['250 g', 'Haferflocken'], ['100 g', 'Mandeln & Co. (Nüsse, Samen)'], ['100 g', 'Agavendicksaft'], ['80 g', 'Kokosöl'], ['', 'Zimt'], ['1 Prise', 'Salz']],
      schritte: [
        { t: 'Ofen vorheizen', x: 'Ofen auf 160 °C Umluft vorheizen.' },
        { t: 'Mischen', x: 'Alle Zutaten in einer Schüssel gut vermischen, bis alles gleichmäßig mit Agavendicksaft und Kokosöl bedeckt ist.' },
        { t: 'Backen', x: 'Masse auf einem Backblech verteilen und backen, dabei einmal wenden.', z: '15–20 Min.' },
        { t: 'Abkühlen lassen', x: 'Auf dem Blech vollständig abkühlen lassen – erst dabei wird es knusprig.' }
      ]
    }]
  },
  {
    id: 'french', titel: 'French Dressing', kategorie: 'Deutsch', bild: 'img/french.svg', emoji: '🥛',
    farbe: ['#8a7a2a', '#ece29a'], portionen: 'für 1 große Schüssel', zeit: '5 Min.',
    teaser: 'Cremig, senfig, kräuterfrisch: das Hausdressing auf Joghurtbasis für jeden grünen Salat.',
    tags: ['vegetarisch', 'schnell'],
    abschnitte: [{
      zutaten: [['150 g', 'Joghurt'], ['45 g', 'Senf'], ['50 g', 'Sahne'], ['50 g', 'Milch'], ['2 EL', '6-Kräuter-Mischung'], ['1 EL', 'Zitronensaft'], ['', 'Pfeffer & Salz']],
      schritte: [{ t: 'Mixen', x: 'Alle Zutaten zusammen mixen.' }, { t: 'Abschmecken', x: 'Mit Salz und Pfeffer abschmecken – fertig.' }]
    }]
  },
  {
    id: 'bigmac', titel: 'BigMac Sauce', kategorie: 'Amerikanisch', bild: 'img/bigmac.svg', emoji: '🥫',
    farbe: ['#b8561a', '#f7c16a'], portionen: 'für 4 Burger', zeit: '10 Min. + 30 Min. kühlen',
    teaser: 'Die Haus-Variante nach Original-Rezeptur – ohne Ketchup, dafür mit Essiggurken, Zucker und Essig für das süß-saure Profil.',
    tags: ['Burger', 'vegetarisch'],
    abschnitte: [{
      zutaten: [['6 EL', 'Mayonnaise (ca. 100 g)'], ['2 EL', 'Essiggurken, sehr fein gehackt'], ['1 EL', 'Gurkenwasser aus dem Glas'], ['2 TL', 'Senf (gelber amerikanischer)'], ['1 TL', 'Weißweinessig'], ['2 TL', 'Zucker'], ['½ TL', 'Paprikapulver edelsüß'], ['½ TL', 'Knoblauchpulver'], ['½ TL', 'Zwiebelpulver'], ['1 Msp', 'Kurkuma (optional, für die Farbe)'], ['1 Prise', 'Salz']],
      schritte: [
        { t: 'Gurken hacken', x: 'Gurken so fein wie möglich hacken – fast zu einer Paste.' },
        { t: 'Verrühren', x: 'Alle Zutaten glatt verrühren.' },
        { t: 'Durchziehen lassen', x: 'Kalt stellen, damit die Pulvergewürze durchziehen. Über Nacht ist noch besser.', z: 'mind. 30 Min.' },
        { t: 'Abschmecken', x: 'Zu sauer → ½ TL Zucker nachlegen. Zu mild → mehr Senf oder Essig.' }
      ]
    }],
    tipps: ['Kein Ketchup: die orange Farbe kommt aus Paprika und Kurkuma.', 'Zucker + Essig ersetzen das amerikanische Sweet Relish.', 'Nur Zwiebelpulver – die gehackte Zwiebel liegt beim Big Mac separat auf dem Burger.', 'Hält abgedeckt etwa eine Woche im Kühlschrank.']
  }
];
