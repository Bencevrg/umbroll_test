import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const DocumentationPage = () => {
  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Umbroll Dashboard / AI – Leírás</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ez a dashboard az árajánlatok alapján készített partner-statisztikákat és toplistákat mutat. A cél, hogy gyorsan lásd:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>mely partnerek a legértékesebbek az árajánlatok szempontjából,</li>
            <li>kiknél "folyik el" a legtöbb idő (sok árajánlat, de kevés siker),</li>
            <li>kik az "alvó" partnerek,</li>
            <li>és milyen termékkategóriákban (területeken) jönnek a sikeres árajánlatok.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Alapfogalmak */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">0) Alapfogalmak (hogyan értelmezzük az adatokat)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium">Árajánlat</h4>
              <p className="text-muted-foreground text-sm">Egy partnerhez tartozó árajánlatkérés.</p>
            </div>
            <div>
              <h4 className="font-medium">Sikeres árajánlat</h4>
              <p className="text-muted-foreground text-sm">Olyan árajánlat, ami vásárlásba fordult.</p>
            </div>
            <div>
              <h4 className="font-medium">Sikertelen árajánlat</h4>
              <p className="text-muted-foreground text-sm">Olyan árajánlat, ami nem fordult vásárlásba.</p>
            </div>
            <div>
              <h4 className="font-medium">Termékkategória</h4>
              <p className="text-muted-foreground text-sm">
                A sikeres árajánlat(ok) al-árajánlatainak "területe" (pl. Pergola, Szalagfüggöny, stb.).
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Fontos: <strong>egy árajánlathoz több al-árajánlat is tartozhat</strong>, ezért egy árajánlat több termékkategóriába is "beleszámolhat".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners tábla */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">1) Partners tábla (partners) – összesített partner statisztika</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Minden sor <strong>egy partner</strong> összesített statisztikája.
          </p>
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Oszlopok</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">partner</h4>
                <p className="text-muted-foreground text-sm">A partner neve.</p>
              </div>
              
              <div>
                <h4 className="font-medium">összes_árajánlat</h4>
                <p className="text-muted-foreground text-sm">Hány árajánlat tartozik a partnerhez összesen.</p>
              </div>
              
              <div>
                <h4 className="font-medium">sikeres_árajánlatok</h4>
                <p className="text-muted-foreground text-sm">Hány árajánlat <strong>sikeres</strong>.</p>
              </div>
              
              <div>
                <h4 className="font-medium">sikertelen_árajánlatok</h4>
                <p className="text-muted-foreground text-sm">Hány árajánlat <strong>sikertelen</strong>.</p>
              </div>
              
              <div>
                <h4 className="font-medium">sikerességi_arány</h4>
                <p className="text-muted-foreground text-sm">A partner nyers sikeressége (arány):</p>
                <code className="block bg-muted px-2 py-1 rounded mt-1 text-sm">sikerességi_arány = sikeres_árajánlatok / összes_árajánlat</code>
              </div>
              
              <div>
                <h4 className="font-medium">korrigált_sikerességi_arány</h4>
                <p className="text-muted-foreground text-sm">
                  "Simított / korrigált" sikerességi arány. Célja: igazságosabb összehasonlítás akkor is, ha valakinek kevés árajánlata van.
                  A cég átlagos sikerességi arányát (kb. 14–15%) is figyelembe veszi, és ezzel "stabilizálja" a kis mintás partnereket.
                </p>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-2">Képlet:</p>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <span className="mr-2">korrigált_sikerességi_arány =</span>
                    <div className="inline-flex flex-col items-center">
                      <span className="border-b border-muted-foreground px-2">sikeres_árajánlatok + k × céges_átlag_sikerességi_arány</span>
                      <span className="px-2">összes_árajánlat + k</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-3 text-center">(A <code className="bg-muted px-1 rounded">k</code> egy beállított korrekciós súly; tipikusan 20.)</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">érték_pontszám</h4>
                <p className="text-muted-foreground text-sm">
                  "Várható sikeres darabszám" jellegű pontszám: egyszerre veszi figyelembe a volument és a minőséget.
                </p>
                <code className="block bg-muted px-2 py-1 rounded mt-1 text-sm">érték_pontszám = korrigált_sikerességi_arány × összes_árajánlat</code>
                <p className="text-muted-foreground text-sm mt-2">
                  Példa gondolat: 70 árajánlatból 58 siker (nagy volumen + jó arány) jellemzően magasabb érték, mint 7-ből 6 (jó arány, de kicsi volumen).
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">sikertelen_pontszám</h4>
                <p className="text-muted-foreground text-sm">
                  "Várható elpocsékolt darabszám" jellegű pontszám (időráfordítás kockázat).
                </p>
                <code className="block bg-muted px-2 py-1 rounded mt-1 text-sm">sikertelen_pontszám = (1 − korrigált_sikerességi_arány) × összes_árajánlat</code>
              </div>
              
              <div>
                <h4 className="font-medium">legutóbbi_sikeres_dátum</h4>
                <p className="text-muted-foreground text-sm">A partner legutóbbi sikeres árajánlatának dátuma.</p>
              </div>
              
              <div>
                <h4 className="font-medium">legutóbbi_árajánlat_dátum</h4>
                <p className="text-muted-foreground text-sm">A partner legutóbbi árajánlatának dátuma (sikeres vagy sikertelen is lehet).</p>
              </div>
              
              <div>
                <h4 className="font-medium">napok_a_legutóbbi_árajánlat_óta</h4>
                <p className="text-muted-foreground text-sm">Hány nap telt el a legutóbbi árajánlat óta.</p>
              </div>
              
              <div>
                <h4 className="font-medium">alvó (igaz/hamis)</h4>
                <p className="text-muted-foreground text-sm">
                  Igaz, ha a partnernél a legutóbbi árajánlat óta eltelt napok száma nagy (jelenleg 90+ nap).
                </p>
              </div>
              
              <div>
                <h4 className="font-medium">kategória</h4>
                <p className="text-muted-foreground text-sm">Automatikus besorolás a partner viselkedése alapján:</p>
                <ul className="list-disc list-inside text-muted-foreground text-sm mt-1 space-y-1">
                  <li><strong>KEVÉS_ÁRAJÁNLAT:</strong> kevés adat (kis minta)</li>
                  <li><strong>MAGAS_ÉRTÉK:</strong> a korrigált_sikerességi_arány a céges átlaghoz képest kiemelkedő</li>
                  <li><strong>ROSSZ_ARÁNY:</strong> a korrigált_sikerességi_arány a céges átlaghoz képest gyenge</li>
                  <li><strong>KÖZEPES:</strong> a kettő közötti tartomány</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">létrehozva</h4>
                <p className="text-muted-foreground text-sm">A riport készítésének dátuma (mikor frissültek a sorok).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top értékes partnerek */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">2) Top értékes partnerek (top_best_customers)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ez a tábla a <strong>MAGAS_ÉRTÉK</strong> kategóriába eső partnereket listázza.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>helyezés:</strong> a rangsor szerinti sorszám</li>
            <li>A rendezés fő logikája: minél nagyobb az <strong>érték_pontszám</strong>, annál előrébb szerepel.</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Megjegyzés: ha kevés partner felel meg a feltételeknek, a lista rövidebb lehet.
          </p>
        </CardContent>
      </Card>

      {/* Kevésbé értékes partnerek */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">3) Kevésbé értékes partnerek (top_worst_customers)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ez a tábla a <strong>ROSSZ_ARÁNY</strong> kategóriába eső partnereket listázza.
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>helyezés:</strong> a rangsor szerinti sorszám</li>
            <li>A rendezés fő logikája: minél nagyobb a <strong>sikertelen_pontszám</strong>, annál előrébb szerepel (tehát ahol sok árajánlatból várhatóan sok "nem fordul át" sikerbe).</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Megjegyzés: ha kevés partner felel meg a feltételeknek, a lista rövidebb lehet.
          </p>
        </CardContent>
      </Card>

      {/* Alvó partnerek */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">4) Alvó partnerek (sleeping_customers)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">Azok a partnerek szerepelnek itt, akiknél:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>alvó = igaz</strong> (vagyis rég volt árajánlatuk).</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            A lista általában a <strong>napok_a_legutóbbi_árajánlat_óta</strong> alapján van "leginkább alvótól" a kevésbé alvó felé rendezve.
          </p>
        </CardContent>
      </Card>

      {/* Termékkategóriák */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">5) Árajánlatok termékkategóriák szerint (partner_product_stats)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Ez a tábla azt mutatja meg, hogy egy partner <strong>milyen termékkategóriákban</strong> rendelkezik sikeres árajánlatokkal.
            Minden sor egy (partner, termékkategória) pár.
          </p>
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Oszlopok</h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">partner2</h4>
                <p className="text-muted-foreground text-sm">A partner neve (ebben a táblában ez az oszlop neve).</p>
              </div>
              <div>
                <h4 className="font-medium">termekkategoria</h4>
                <p className="text-muted-foreground text-sm">A termékkategória/terület neve (pl. Pergola, Szalagfüggöny, stb.).</p>
              </div>
              <div>
                <h4 className="font-medium">db</h4>
                <p className="text-muted-foreground text-sm">
                  Hány darab sikeres árajánlat esett ebbe a termékkategóriába.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  Fontos: mivel egy árajánlathoz több al-árajánlat is tartozhat, ezért a termékkategóriákban szereplő db-k összege egy partnernél akár nagyobb is lehet, mint a partners táblában lévő sikeres_árajánlatok érték.
                </p>
              </div>
              <div>
                <h4 className="font-medium">létrehozva2</h4>
                <p className="text-muted-foreground text-sm">A riport készítésének dátuma (mikor frissültek a sorok).</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adatok frissítése */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Adatok frissítése</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Az "Adatok frissítése" gomb a legfrissebb riportot tölti be, és frissíti a táblákat.
            A frissítés dátumát a táblákban a <strong>létrehozva</strong> / <strong>létrehozva2</strong> oszlop mutatja.
          </p>
        </CardContent>
      </Card>

      {/* Jogosultságok */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Jogosultságok és belépés (amit felhasználóként érdemes tudni)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong>Kétféle felhasználói szerepkör van:</strong> felhasználó és admin.</li>
            <li><strong>Fiókot létrehozni csak meghívóval lehet</strong> (admin által küldött meghívó alapján).</li>
            <li>Bejelentkezés után a rendszer <strong>kétlépcsős azonosítást</strong> kér (2FA).</li>
            <li>Az admin felhasználók számára elérhető egy <strong>Admin panel</strong>, ahol a felhasználókezelés és a meghívások kezelése történik.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Chat (AI asszisztens)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A Chat oldalon magyarul kérdezhetsz a dashboard adatairól (pl. "melyik partnernek van a legtöbb árajánlata?").
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
