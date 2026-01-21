# Gider Takip Uygulaması - Coolify Kurulum Rehberi

Bu rehber, projenizin Coolify platformu üzerinden internete açılması için gereken adımları içerir.
Tüm teknik altyapı (Docker) tarafımca hazırlanmıştır. Sadece aşağıdaki ekran adımlarını takip etmeniz yeterlidir.

## 1. Hazırlık
- Projenizin son halini GitHub veya GitLab hesabınıza yüklediğinizden (push) emin olun.
  - Terminal'de: `git push origin main`

## 2. Coolify Paneli İşlemleri

1.  **Coolify Paneline Giriş Yapın.**
2.  **Yeni Proje Ekleme:**
    - `+ New Resource` butonuna tıklayın.
    - `Application` seçeneğini seçin.
    - Kaynak olarak `Public Repository` (herkese açık ise) veya `Private Repository` (gizli ise ve GitHub App bağlıysa) seçin.
    - Depo (Repository) adresinizi yapıştırın (örn: `github.com/kullaniciadim/gider-takip-app`).
    - Branch ismini (genelde `main` veya `master`) kontrol edin.

3.  **Konfigürasyon (Önemli Adım):**
    - Coolify, `Dockerfile` dosyasını otomatik algılayacaktır. **Build Pack** kısmında `Docker` seçili olduğundan emin olun.
    - Uygulama detay sayfasında **Secrets** veya **Environment Variables** sekmesine gidin.
    - Aşağıdaki değerleri tek tek ekleyin:

    | Anahtar (Key) | Değer (Value) | Açıklama |
    | :--- | :--- | :--- |
    | `DATABASE_URL` | `postgresql://...` | Veritabanı bağlantı adresiniz (Coolify'da bir Postgres DB oluşturup onun bağlantısını buraya yapıştırabilirsiniz). |
    | `AUTH_SECRET` | `(Rastgele uzun bir şifre)` | Güvenlik için gereklidir. Örn: `bura-cok-gizli-bir-sifre-olmali` yazabilirsiniz. |
    | `AUTH_URL` | `https://sitenizin-adresi.com` | Uygulamanızın yayınlanacağı tam web adresi. |
    | `NEXTAUTH_URL` | `https://sitenizin-adresi.com` | `AUTH_URL` ile birebir aynı olmalı. |

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
