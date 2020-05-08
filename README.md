# cryptology-homework
Foobar is a Python library for dealing with word pluralization.

## Kurulum

[MongoDB community server](https://www.mongodb.com/download-center/community)'ı kurun.
[Node.js](https://nodejs.org/en/download/)'i kurun.

```node
npm install
```

## Kullanım
```node
npm app.js
```
Default olarak [http://localhost:3000/](http://localhost:3000/)'da çalışır.

### Bilgi
**Adım 1**
- [x] **Adım 1 : hello**
  - [x] Mail atma yapıldı
  - [x] Mail okuma yapıldı
  
- [x] **Adım 2 : simetrik şifreleme**
   - [x] AES altyapısı kuruldu [crypto-js](https://www.npmjs.com/package/crypto-js)
   - [x] Test seneryoları hazırlandı [index](http://localhost:3000/)'de şifreleme ve şifre çözme yapılabilir.   
   
- [x] **Adım 3 : spam gönderme**
  - [x] [Spam](http://www.100wordstory.org/) seçildi.
  - [x] 0-100 arası rastgele sayı üreten **sözde rastgele** algoritme üretildi.
  - [x] [send-spam](http://localhost:3000/send-spam)'e girildiğinde spam üretilip gönderilmeye hazır gelir.
  - [x] Büzütünlük analizi : gönderilen spamlerin özetleri tutulur. Veritabanından spam içeriği değiştirildiğinde arayüzde özet değişti uyarısı çıkar.
  - [ ] :bug: spam içeriği değiştirildikten sonra [spam-analysis](http://localhost:3000/spam-analysis) sayfası bozulur. Önce spam analizlerine bakıp sonra özet kontrolü yapılmalıdır.
  - [x] [spam-analysis](http://localhost:3000/spam-analysis)'de üretilen spamlerin rastgeleliği (kelimelerin üretim sıklığı), en çok benzeyen iki spam ve onların benzerlik oranları, özetleri, ve özetlerinin benzerlik oranları gösterilir.

- [x] **Adım 4 : asimetrik şifreleme**
  - [x] RSA altyapısı kuruldu [node-rsa](https://www.npmjs.com/package/node-rsa)
  - [x] Mesajlerın özeti ([SHA256](https://www.npmjs.com/package/crypto-js)) oluşturularak kaydedildi.
  - [x] Mesajler imzalandı
  - [x] Mesajlerın imza kontrolü ve özet kontrolü yapılarak şifresi çözüldü.
  - [x] Ortadaki adam senaryosu yazıldı. 
  - [x] Mesajları ortadaki adam imzaladıysa ya da içeriği değiştirildiyse arayüzde bildirildi.
  
- [x] **Adım 5 : imaj gönderme imaja watermark ekleme, içine şifre gömme(steganografi), gönderme, şifreyi çözme**
  - [x] Arayüzden alınan imajlara [text-watermark](https://www.npmjs.com/package/text-watermark) ile watermark eklendi. /public/img/postimages/ altına kaydedildi.
  - [x] Arayüzden alınan metin AES ile şifrelenip [steggy-noencrypt](https://www.npmjs.com/package/steggy-noencrypt) ile imaja gizlendi.
  - [x] AES keyine sahip kullanıcılarda şifreler çözülerek mesaj içerikleri gösterildi.
  
- [ ] **Adım 6 : kullanıcı doğrulama**
