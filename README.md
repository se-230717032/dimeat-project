# Dimeat

Dimeat, MSKU Yazılım Proje Yönetimi dersi kapsamında geliştirilen beslenme ve sosyal yaşam uygulamasıdır. E-posta/şifre ile hesap oluşturma, giriş, çıkış, özel profil, onboarding, günlük kalori ve makro toplamları ve manuel veya kaynaklı besin hesabı içeren öğün günlüğü vardır. Topluluk, mesajlaşma ve alışkanlık sayfaları şu anda geliştirme aşamasındadır.

## Teknolojiler

Next.js App Router, React, TypeScript, Tailwind CSS, Supabase (PostgreSQL, Auth ve Storage için altyapı) ve Lucide ikonları.

## Yerel geliştirme

Node.js 20.9 veya üstünü ve pnpm'i kurun. Proje kökünde:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Windows PowerShell'de `cp .env.example .env.local` komutu da çalışır. Uygulama `http://localhost:3000` adresinde açılır. Supabase bilgileri olmadan giriş/kayıt sayfaları kurulum uyarısı gösterir; uygulama sayfaları oturum gerektirir.

## Supabase kurulumu

[Supabase Dashboard](https://supabase.com/dashboard) üzerinden yeni bir proje oluşturun. Project URL ile anon/public key (veya publishable key) değerlerini `.env.local` dosyasına ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_KEY
```

Bu iki değer istemci tarafında kullanılabilen public bilgilerdir. `NEXT_PUBLIC_SUPABASE_ANON_KEY` değişkeni Supabase'in eski anon key değerini veya yeni publishable key değerini kabul eder. Service role key ve diğer gizli anahtarları `NEXT_PUBLIC_` değişkenlerine koymayın. `.env.local` Git tarafından yok sayılır. İstemci oluşturma işlevleri `src/lib/supabase/client.ts` ve `src/lib/supabase/server.ts` içindedir. Next.js `proxy.ts` oturum çerezlerini yeniler; sunucu layout'ları `getUser()` ile kullanıcıyı doğrular.

### Veritabanı migration'ı

Migration'ları sırasıyla uygulayın:

1. `20261029000100_profiles.sql` — kullanıcı profilleri ve onboarding.
2. `20261110000100_meal_entries.sql` — kullanıcıya özel öğün kayıtları.
3. `20261116000100_foods_and_nutrition.sql` — salt okunur besin kataloğu ve öğünlerde kaynak bilgisi. Mevcut öğün kayıtları korunur.
4. `20261116000200_food_catalog_seed_repair.sql` — doğrulanmış USDA yumurta, haşlanmış yumurta, muz, pirinç ve makarna kayıtlarını eksikse ekler; mevcut besin ve öğün satırlarını değiştirmez.

Son migration, USDA FoodData Central kaynaklı doğrulanmış 100 g değerlerini ve varsa birim gram karşılıklarını ekler. `foods` tablosu authenticated kullanıcılar tarafından okunabilir; uygulama kullanıcıları kataloğa yazamaz.

Supabase CLI ile proje kökünde:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

`YOUR_PROJECT_REF` değerini Dashboard'daki proje kimliğiyle değiştirin. CLI kullanmıyorsanız migration dosyasının tamamını Supabase SQL Editor'da tek seferde çalıştırabilirsiniz. Migration'ı kullanıcı kaydını denemeden önce uygulayın.

### Authentication ve e-posta doğrulama

Authentication yöntemi e-posta ve şifredir. Supabase Dashboard'da **Authentication → Providers → Email** bölümünden sağlayıcıyı etkinleştirin. Varsayılan Confirm signup şablonu desteklenir: kayıt işlemi `/auth/callback` adresine yönlendirir ve route doğrulama kodunu oturuma çevirir. Özel token hash şablonu kullanılıyorsa `/auth/confirm` route'u da korunur. **Authentication → URL Configuration** altında Site URL yerelde `http://localhost:3000`, izinli yönlendirmeler `http://localhost:3000/**` olmalıdır.

### Kaynaklı besin arama

Yemek formu, kullanıcı yazdıkça Supabase `foods` kataloğunu ve USDA'yı otomatik arar. Kullanıcı ayrıca **USDA'da ara** ile aramayı yineleyebilir ve **Paketli ürünü ara** ile Open Food Facts ürünlerini sorgulayabilir. Harici servis yanıt vermezse manuel giriş kullanılabilir. Otomatik değerler 100 g kaynağından miktara oranlanır; kaydetme sırasında sunucu kaynağı yeniden okuyup hesabı tekrar yapar. Kaynağı veya gram karşılığı olmayan adet/porsiyon için hesap yapılmaz. Besin seçilmeden kaydetme girişimi önce bir uyarı gösterir ve manuel kayıt için ayrıca onay ister.

USDA araması varsayılan olarak düşük limitli `DEMO_KEY` ile çalışır. Düzenli kullanım için [FoodData Central API anahtarı](https://fdc.nal.usda.gov/api-guide/) edinip `.env.local` içine sunucuya özel `USDA_API_KEY` ekleyin. Bu anahtarı `NEXT_PUBLIC_` değişkenine koymayın.

Open Food Facts, uygulamayı tanımlayan özel User-Agent ister. Paketli ürün aramasını etkinleştirmek için `.env.local` içine `OPEN_FOOD_FACTS_CONTACT_EMAIL` ekleyip sunucuyu yeniden başlatın. API araması yalnızca kullanıcı düğmeye bastığında yapılır; sunucuda dakika başına sınır ve kısa süreli önbellek vardır. Open Food Facts verileri [ODbL](https://opendatacommons.org/licenses/odbl/1-0/) kapsamındadır; sonuç ve kaydedilen kaynaklı öğün üzerinde atıf bağlantısı gösterilir. Open Food Facts ürünleri ortak `foods` kataloğuna kopyalanmaz. Ürün verilerini toplu olarak yeniden dağıtacak bir özellik eklenirse ODbL paylaşım koşulları ayrıca karşılanmalıdır. USDA FoodData Central verileri [CC0](https://fdc.nal.usda.gov/api-guide/) kapsamındadır ve kaynak adı ile FDC bağlantısı gösterilir. Open Food Facts ürün verileri topluluk katkısıdır; doğruluğu garanti edilmez. Her iki kaynaktaki hesaplar tahmindir.

## Kontroller

```bash
pnpm build
pnpm typecheck
pnpm lint
```

`/home` ve `/diary` aynı öğün kayıtlarını okur. Onboarding verileri kullanıcıya özel profil satırına kaydedilir. Dimeat tıbbi teşhis veya tedavi sunmaz.

## Proje planı

GitHub deposundaki [haftalık proje raporları](docs/weekly-reports) korunur. Proje planındaki aşamalar:

- [x] M0: Proje seçimi ve ekip organizasyonu
- [x] M1: Proje başlangıcı, paydaşlar ve başarı ölçütleri
- [x] M2: İş listesi, zaman planı, sorumluluklar ve riskler
- [ ] M3: Ara dönem ürün ve plan değerlendirmesi
- [ ] M4: Değişiklik, kalite ve ilerleme takibi
- [ ] M5: Son demo ve kapanış raporu

## Ekip

| Üye | Öğrenci numarası | Sorumluluk |
| --- | --- | --- |
| Cemre Alkış | 230717008 | Proje yönetimi ve geliştirme |
| Ebru Sena Ünsal | 230717032 | Teknik liderlik ve geliştirme |
| Harun Arslan | 220717604 | Kalite, test ve geliştirme |
| Aysima Tatlı | 230717043 | Dokümantasyon ve sürüm yönetimi |

## Dizinler

- `src/`: Next.js uygulaması ve sunucu işlemleri
- `supabase/migrations/`: Veritabanı şeması ve besin kataloğu migration'ları
- `docs/weekly-reports/`: Mevcut proje raporları
