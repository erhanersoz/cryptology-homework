# cryptology-homework
An encrypted chat written in Node.js utilizing MongoDB, AES, RSA and steganography.

## Features

- AES Encryption
- RSA Encryption
- Spam generating with pseudorandom number generator
- adding watermark to image
- Embedding encrypted messages on images with steganography

## Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [MongoDB community server](https://www.mongodb.com/download-center/community)

## Installing

```
git clone https://github.com/erhanersoz/cryptology-homework.git
```

```
npm install
```

## Usage

```
npm start
```

## Screenshots

#### AES

> If session has the key, the message looks like this.

![aes-chats-erhan](https://user-images.githubusercontent.com/15858441/89688602-337e3c00-d90b-11ea-9498-9f2b8ad0ecd5.png)

> If session has not the key, the message looks like this.

![aes-chats-bob](https://user-images.githubusercontent.com/15858441/89688757-87892080-d90b-11ea-8031-adc1e25614fa.png)

#### RSA

> If session has the key, the message looks like first massage.

> If the message is signed by man in the middle , the message looks like second massage.

> If the message is modified , the message looks like thirth massage.

![rsa-chating](https://user-images.githubusercontent.com/15858441/89688780-91128880-d90b-11ea-8d9a-ee9e9a12311d.png)

#### Watermark, AES, steganography

> If session has the key, the message looks like this.

![send-image-alice](https://user-images.githubusercontent.com/15858441/89688921-e2bb1300-d90b-11ea-8e7d-f0cb8c3e465b.png)

> If session has not the key, the message looks like this.

![send-image-bob](https://user-images.githubusercontent.com/15858441/89688933-e77fc700-d90b-11ea-8f11-839fd9c09c7b.png)

