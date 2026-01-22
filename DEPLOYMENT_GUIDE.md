# Gider Takip Uygulaması - Coolify Kurulum Rehberi

Bu rehber, projenizin Coolify platformu üzerinden internete açılması için gereken adımları içerir.
Tüm teknik altyapı (Docker) tarafımca hazırlanmıştır. Sadece aşağıdaki ekran adımlarını takip etmeniz yeterlidir.

## 1. Hazırlık
- Projenizin son halini GitHub veya GitLab hesabınıza yüklediğinizden (push) emin olun.
  - Terminal'de: `git push origin main`

## 2. Coolify Paneli İşlemleri

1.  **Coolify Paneline Giriş Yapın.**
2.  **Yeni Proje Ekleme:**
    1.  Coolify ana ekranında mevcut bir Projenize girin (Örn: `My First Project`) ve `Production` ortamını seçin.
    2.  **`+ New Resource`** butonuna tıklayın.
    3.  Açılan seçeneklerden **`Application`** kutusuna tıklayın.
    4.  Kaynak seçimi ekranında:
        - **Public Repository:** Eğer GitHub reponuz herkese açık ise bunu seçin (En kolayıdır).
        - **Private Repository (with GitHub App):** Eğer reponuz gizli ise ve Coolify'a GitHub hesabınızı bağladıysanız bunu seçin.
    5.  **Repository URL** alanına GitHub adresinizi tam olarak yapıştırın:
        - Örnek: `https://github.com/emreduman/gidertakip`
    6.  **Check Repository** (veya *Load Repository*) butonuna basın.
    7.  Aşağıdaki ayarları kontrol edin:
        - **Branch:** `main` (veya `master`) olduğundan emin olun.
        - **Build Pack:** Otomatik olarak `Docker` seçili gelmelidir.
    8.  **Save** veya **Continue** butonuna basarak uygulamayı oluşturun.

3.  **Konfigürasyon (Önemli Adım):**

    Bu adımda uygulamanın çalışması için gerekli ayarları yapacağız. İki aşamadan oluşur: Veritabanı kurulumu ve uygulama ayarları.

    ### Aşam 3.1: Veritabanını Oluşturma
    Eğer henüz bir veritabanınız yoksa, Coolify içinde oluşturun:
    1.  Proje ana sayfanıza gidin (`+ New Resource` dediğiniz yer).
    2.  `+ New Resource` -> `Database` -> `PostgreSQL` seçin.
    3.  Kurulum bittikten sonra veritabanı detayına girin.
    4.  **Connection String** bulma:
        - Ekran görüntüsünde **Network** başlığının hemen altında **Postgres URL (internal)** yazan bir alan var (Sayfanın en altına doğru).
        - O alandaki `postgresql://...` diye başlayan metni kopyalayın.
        - *Alternatif:* Eğer bulamazsanız, yukarıdaki **Password** kutusundaki **Göz (👁️)** simgesine tıklayıp şifreyi bir yere not edin. Adres şu formatta olacaktır:
          `postgresql://postgres:ŞİFRENİZ@VeritabanıServisİsmi:5432/postgres`
          *(Veritabanı Servis İsmi, en üstteki "Name" kutusunda yazan `postgresql-database-...` başlayan uzun isimdir.)*

    ### Aşam 3.2: Uygulama Ayarlarını Girme
    1.  Tekrar oluşturduğunuz Uygulamaya (Application) gelin.
    2.  Sol menüden veya sekmelerden **Environment Variables** (veya **Secrets**) kısmına tıklayın.
    3.  Aşağıdaki değişkenleri tek tek ekleyin (`+ Add Variable` diyerek):

    | Anahtar (Key) (Kopyala) | Değer (Value) (Yapıştır) | Açıklama |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | *(Veritabanından kopyaladığınız adres)* | Az önce kopyaladığınız `postgresql://...` ile başlayan adres. |
    | `AUTH_SECRET` | `rastgele-gizli-uzun-bir-sifre-yazın-1234` | Güvenlik şifresidir. Rastgele harf ve rakamlardan oluşsun. |
    | `AUTH_URL` | `https://uygulama-adiniz.coolify-domain.com` | Coolify'ın size verdiği veya sizin ayarladığınız **Domain** adresi. Sonunda `/` olmasın. |
    | `NEXTAUTH_URL` | *(Üstteki AUTH_URL ile aynısını yazın)* | `https://uygulama-adiniz.coolify-domain.com` |

    4.  **Build Pack Ayarı (Düzeltme):**
        - Ekran görüntünüze göre şu an **Nixpacks** seçili görünüyor.
        - Aynı sayfada (Configuration) **General** veya **Build** başlığı altında **Build Pack** seçeneğini bulun.
        - Seçeneği **`Dockerfile`** olarak değiştirin ve **Save** butonuna basın.
        - *Eğer Dockerfile seçeneği çıkmıyorsa*, GitHub'a `Dockerfile` dosyasını gönderdiğinizden emin olun (`git push origin main` yaptınız mı?).
    5.  **Domain Ayarı:** **Configuration** -> **General** altında **Domains** kısmına uygulamanızın erişileceği adresi yazın (örn: `https://gider.benimsitem.com` veya Coolify'ın verdiği test adresi). **Save** butonuna basmayı unutmayın.

4.  **Deploy (Yayınlama):**
    - Sağ üstteki veya ana ekrandaki **Deploy** butonuna basın.
    - "Build Logs" ekranından işlemlerin bitmesini bekleyin (ilk kurulum 3-5 dakika sürebilir).

## 3. Sorun Giderme
- **Build Hatası Alırsanız:**
  - `Environment Variables` kısmında eksik olmadığını kontrol edin.
  - Veritabanı adresinin (`DATABASE_URL`) doğru olduğundan emin olun.
- **Erişim Sorunu:**
  - `AUTH_URL` adresinin `https://` ile başladığından emin olun.

## Not
Uygulama her başladığında otomatik olarak veritabanı tablolarını günceller. Ekstra bir ayar yapmanıza gerek yoktur.
