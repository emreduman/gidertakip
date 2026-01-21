# Projeyi GitHub'a Yükleme Rehberi

Projenizi bilgisayarınızdan GitHub'a aktarmak için aşağıdaki adımları sırasıyla uygulayın.

## 1. GitHub'da Depo (Repository) Oluşturma
1.  [github.com](https://github.com) adresine gidin ve giriş yapın.
2.  Sağ üst köşedeki **+** simgesine tıklayın ve **New repository** seçeneğini seçin.
3.  **Repository name** kısmına bir isim verin (örn: `gider-takip-app`).
4.  **Public** (herkes görebilir) veya **Private** (gizli) seçeneğini işaretleyin.
5.  **Create repository** butonuna basın.
6.  Açılan sayfada **"…or push an existing repository from the command line"** başlığı altındaki komutları bir kenarda tutun (birazdan kullanacağız).

## 2. Terminal Komutları

Bilgisayarınızdaki proje dosyalarını hazırlayıp göndermek için aşağıdaki komutları kullanacağız. Bu komutları **Terminal** ekranına sırasıyla kopyalayıp yapıştırın (Her satırdan sonra Enter'a basın):

### Adım 1: Dosyaları Hazırla
Tüm değişiklikleri paketlemek için:
```bash
git add .
```

### Adım 2: Değişiklikleri Onayla (Commit)
Bu değişikliklere bir isim vererek kaydedin:
```bash
git commit -m "Proje son hali ve deploy ayarlari"
```

### Adım 3: Ana Şubeyi Belirle (Opsiyonel ama önerilir)
```bash
git branch -M main
```

### Adım 4: GitHub ile Bağlantı Kur
**ÖNEMLİ:** Aşağıdaki komuttaki `KULLANICI_ADI` kısmını kendi GitHub kullanıcı adınızla değiştirin. Eğer GitHub sayfasında size verilen bir adres varsa onu kullanın.
```bash
git remote add origin https://github.com/KULLANICI_ADI/gider-takip-app.git
```
*(Eğer "remote origin already exists" hatası alırsanız, bu adımı atlayıp doğrudan Adım 5'e geçin)*

### Adım 5: Yükle (Push)
Dosyaları GitHub'a gönderin:
```bash
git push -u origin main
```

---

## Olası Hatalar ve Çözümleri

- **Şifre Sorarsa:** GitHub şifrenizi girerken ekranda karakterler görünmez (yazmıyor sanmayın), şifreyi yazıp Enter'a basın.
- **Authentication Failed Hatası:** GitHub artık şifre yerine "Personal Access Token" kullanmanızı isteyebilir veya tarayıcıdan giriş yapmanızı bekleyebilir.
- **Remote Exists Hatası:** Daha önce başka bir yere yüklemeye çalıştıysanız `git remote set-url origin https://github.com/KULLANICI_ADI/gider-takip-app.git` komutunu kullanarak adresi düzeltebilirsiniz.

İşlem bittiğinde GitHub sayfasını yenileyin, kodlarınızı orada göreceksiniz.
