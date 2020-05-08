const express = require('express');
const router = express.Router();
const path = require('path');
// AES ve SHA256 için
const CryptoJS = require("crypto-js");
// RSA için
const NodeRSA = require('node-rsa');
// dizilerin benzerliğini bulmak için
const similarity = require('compute-cosine-similarity');
// özetlerin benzerliğini bulmak için
const stringSimilarity = require('string-similarity');
// doysa işlemleri için
const fs = require('fs');
// watermark eklemek için
const watermark = require('text-watermark');
// steganography için
const steggy = require('steggy-noencrypt')
// modeller
const User = require('../models/user');
const AESChat = require('../models/aesChat');
const AESMessage = require('../models/aesMessage');
const Spam = require('../models/spam');
const RSAChat = require('../models/rsaChat');
const RSAMessage = require('../models/rsaMessage');
const RSAKey = require('../models/rsaKey');
const Image = require('../models/image');


// arayüzde mesaj gönderilme zamanı için
const months = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];


getIndex = function(req,res){
    res.render('index');
}

getLogin = function(req,res){
    res.render('login');
}

getRegister = function(req,res){
    res.render('register');
}

getAESChatsDefault = function(req,res){
    if(req.session.user){

        let data = new Object();

        const userPromise = User.findOne({username: req.session.user}).exec();
        userPromise.then(function (user) {
            data.sessionUsername = user.username;
        });  

        const allChatsPromise = AESChat.find({}).exec();
        allChatsPromise.then(function (chats) {
            if(chats[0] != null){
                data.chats = chats;
            }
            res.render('aes-chats',data);
        });

    } else {
        res.redirect('/login');
    }  
}

getAESChatsWithUser = function(req,res){
    if(req.session.user){

        let data = new Object();

        const sessionUserPromise = User.findOne({username: req.session.user}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });  

        const allChatsPromise = AESChat.find({}).exec();
        allChatsPromise.then(function (chats) {
            if(chats[0] != null){
                data.chats = chats;
            }
        });
          
        const focusChatPromise = AESChat.findOne({ _id : req.params.chatId}).exec();
        focusChatPromise.then(function (focusChat){
            if(focusChat != null){

                data.focusChat = focusChat;

                const messagesPromise = AESMessage.find({chatId : focusChat._id}).exec();
                messagesPromise.then(function (messages) {
                    if(messages[0] != null){

                        for(let i = 0; i<messages.length;i++){    
                            if(req.session.user == messages[i].toUser || req.session.user == messages[i].fromUser){

                                const decrypted = CryptoJS.AES.decrypt(messages[i].content, focusChat.key).toString(CryptoJS.enc.Utf8);
                                messages[i].content = decrypted;
                                let date = new Date;
                                date.setTime(messages[i].created_at);
                                const tempMinutes =date.getMinutes()<10?'0':'';
                                const minute =tempMinutes + date.getMinutes();
                                const tempHours =date.getHours()<10?'0':'';
                                const hour =tempHours + date.getHours();
                                const month = months[date.getMonth()];
                                messages[i].time = date.getDate() + ' ' + month + ' ' +date.getFullYear() + ' ' + hour + ':' + minute ;
                            }
                        }                                
                        data.messages = messages;  
                    }
                    res.render('aes-chats',data);
                });
            }
        });         

    } else {
        res.redirect('/login');
    }  
}

getAESChatingDefault = function(req,res){
    if(req.session.user){

        let data = new Object();

        const sessionUserPromise = User.findOne({username: req.session.user}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });  

        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;     
            res.render('aes-chating', data);       
        });   

    } else {
        res.redirect('/login');
    }
}

getAESChatingWithUser = function(req,res){
    if(req.session.user){
        
        let data = new Object();
        const sessionUsername = req.session.user;
        const targetUsername = req.params.username;

        const sessionUserPromise = User.findOne({username: sessionUsername}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });   

        const targetUserPromise = User.findOne({username : targetUsername}).exec();
        targetUserPromise.then(function (user) {
            data.targetUsername = user.username;
        });

        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;
        });

        let keyString; // her chat için kullanıcı adlarından oluşan bir string
        let hashedKey; // AES kullanılan chatlerin keyi
        if(sessionUsername.localeCompare(targetUsername) == -1){
            // Alfabetik olarak sessionUsername < targetUsername ise 
            keyString = sessionUsername + targetUsername;
            hashedKey =  CryptoJS.SHA256(keyString);
        }
        else{
            // Alfabetik olarak targetUsername < sessionUsername ise 
            keyString = targetUsername + sessionUsername;
            hashedKey = CryptoJS.SHA256(keyString);
        }

        const focusChatPromise = AESChat.findOne({idString : keyString}).exec();
        focusChatPromise.then(function (focusChat) {
            if(focusChat == null){

                let newChatObj = {
                    idString : keyString,
                    user1 : sessionUsername,
                    user2 : targetUsername,
                    key : hashedKey
                }

                const newChat = new AESChat(newChatObj);
                newChat.save(function(err){
                    if(err){
                        res.render('error', { type: 'danger', title:'getAESChatingWithUser() newChat.save', errorMessage:err });
                    }else{
                        res.render('aes-chating', data);
                    }                  
                });
            }
            else{
                const messagesPromise = AESMessage.find({chatId : focusChat._id}).exec();
                messagesPromise.then(function (messages) {
                    if(messages[0] != null){
                        for(let i = 0; i<messages.length;i++){    
                            if(req.session.user == messages[i].toUser || req.session.user == messages[i].fromUser){
                                const decrypted = CryptoJS.AES.decrypt(messages[i].content, focusChat.key).toString(CryptoJS.enc.Utf8);
                                messages[i].content = decrypted;
                                let date = new Date;
                                date.setTime(messages[i].created_at);
                                const tempMinutes =date.getMinutes()<10?'0':'';
                                const minute =tempMinutes + date.getMinutes();
                                const tempHours =date.getHours()<10?'0':'';
                                const hour =tempHours + date.getHours();
                                const month = months[date.getMonth()];
                                messages[i].time = date.getDate() + ' ' + month + ' ' +date.getFullYear() + ' ' + hour + ':' + minute ;
                            }
                        }                                
                        data.messages = messages;  
                    }
                    res.render('aes-chating',data);
                });
            }
        });

    } else {
        res.redirect('/login');
    }
}

getSendSpamDefault = function(req,res){
    if(req.session.user){

        let data = new Object();

        const sessionUserPromise = User.findOne({username: req.session.user}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });  

        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;     
            res.render('send-spam', data);       
        });   

    } else {
        res.redirect('/login');
    }   
}

getSendSpamWithUser = function (req, res) {
    if(req.session.user){

        let data = new Object();

        function generateSpam(){

            let oneHundredWordStory = `It’s hard to get together with his friends because they all like to hibernate. Everyone mostly prefers staying home, so when they make plans with him they often cancel, last-minute; he can’t blame them, because he also likes to hibernate, and after the initial annoyance, feeling his friends are unreliable or don’t care about him, he’s relieved to stay in with books and music and internet, endless shows to binge-watch and plenty of food and whiskey so really, what’s the point of going anywhere? He has a number of good, close friends who, of course, he hasn’t seen in years.`;
            oneHundredWordStory= oneHundredWordStory.replace(/\.|,|;/g,""); // özel karakterler çıkarılıyor. 
            const wordArray = oneHundredWordStory.split(" ");

            function reverseString(str) {
                // string ters cevirme fonksiyonu.
                return str.split("").reverse().join("");
            }

            function myPrng(seed){
                // Benim sözde rastgele sayı üretecim.
                // Kare ortası yönteminden feyiz aldım.
                // Seed alinir karesi alinir ters çevrilir 8 haneli hale getirilip başı 0 lar ile doldurulur. 
                // Son 4 basamak yeni seed olarak beslenir.
                // Rastgele sayı olarak kullanılırken seed in ilk 2 basamağı kullanılır.
                
                const result = reverseString((seed * seed).toString()).padStart(8,"0").slice(4, 8);
                seed = parseInt(result);    
                return seed
            }

            let x = Math.floor(Math.random() * (9999 - 1000)) + 1000; // 1000 ile 9999 arasında sayı üretilir. Bu sayı başlangıç değeri olarak kullanılır.
            let message ='';
            for (let i = 0; i < 20; i++) {
                // 20 tane sözde rastgele sayı üretilir.
                x = myPrng(x);   
                message = message + wordArray[Math.floor(x/100)] + ' '; // her yeni üretilen sayıya karşılık gelen kelime message'a eklenir.
            }
            return message;
        }

        data.spamMessage = generateSpam();

        const sessionUsername = req.session.user;
        const targetUsername = req.params.username;

        const sessionUserPromise = User.findOne({username: sessionUsername}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });   

        const targetUserPromise = User.findOne({username : targetUsername}).exec();
        targetUserPromise.then(function (user) {
            data.targetUsername = user.username;
        });

        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;
        });

        let keyString; // her chat için kullanıcı adlarından oluşan bir string
        let hashedKey; // AES kullanılan chatlerin keyi
        if(sessionUsername.localeCompare(targetUsername) == -1){
            // Alfabetik olarak sessionUsername < targetUsername ise 
            keyString = sessionUsername + targetUsername;
            hashedKey =  CryptoJS.SHA256(keyString);
        }
        else{
            // Alfabetik olarak targetUsername < sessionUsername ise 
            keyString = targetUsername + sessionUsername;
            hashedKey = CryptoJS.SHA256(keyString);
        }

        const focusChatPromise = AESChat.findOne({idString : keyString}).exec();
        focusChatPromise.then(function (focusChat) {
            if(focusChat == null){

                let newChatObj = {
                    idString : keyString,
                    user1 : sessionUsername,
                    user2 : targetUsername,
                    key : hashedKey
                }

                const newChat = new AESChat(newChatObj);
                newChat.save(function(err){
                    if(err){
                        res.render('error', { type: 'danger', title:'getSendSpamWithUser() newChat.save', errorMessage:err });
                    }else{
                        res.render('send-spam', data);
                    }                   
                });
            }
            else{
                const spamsPromise = Spam.find({chatId : focusChat._id}).exec();
                spamsPromise.then(function (spams) {
                    if(spams[0] != null){
                        for(let i = 0; i<spams.length;i++){
                            // Spamin özeti değişmiş mi? 
                            if(CryptoJS.SHA256(spams[i].content).toString(CryptoJS.enc.Hex) == spams[i].contentHash) {
                                const decrypted = CryptoJS.AES.decrypt(spams[i].content, focusChat.key).toString(CryptoJS.enc.Utf8);
                                spams[i].content = decrypted;
                            }
                            else{
                                spams[i].content = "Bu Mesajın içeriği değiştirilmiş.";                                                    
                            }      
                            let date = new Date;
                            date.setTime(spams[i].created_at);
                            const tempMinutes =date.getMinutes()<10?'0':'';
                            const minute =tempMinutes + date.getMinutes();
                            const tempHours =date.getHours()<10?'0':'';
                            const hour =tempHours + date.getHours();
                            const month = months[date.getMonth()];
                            spams[i].time = date.getDate() + ' ' + month + ' ' +date.getFullYear() + ' ' + hour + ':' + minute ;                                         
                        }
                        data.messages = spams;
                    }      
                    res.render('send-spam', data);              
                });
            }
        });
    }else {
        res.redirect('/login');
    }  
}

getSpamAnalysis = function(req,res){

    let data = new Object();
    // oneHundredWordStory seçilen hikaye
    let oneHundredWordStory = `It’s hard to get together with his friends because they all like to hibernate. Everyone mostly prefers staying home, so when they make plans with him they often cancel, last-minute; he can’t blame them, because he also likes to hibernate, and after the initial annoyance, feeling his friends are unreliable or don’t care about him, he’s relieved to stay in with books and music and internet, endless shows to binge-watch and plenty of food and whiskey so really, what’s the point of going anywhere? He has a number of good, close friends who, of course, he hasn’t seen in years.`;
    data.oneHundredWordStory = oneHundredWordStory;
    oneHundredWordStory= oneHundredWordStory.replace(/\.|,|;/g,""); // kelimeleri ayıklamak için bazı karakterler çıkartılıyor.    
    const wordArray = oneHundredWordStory.split(" ");
    let words = new Array(); // tekrarsız kelimeler.

    // hikayedeki kelimelerden tekrarsız kelime dizisi oluşturuluyor.
    for (let i = 0; i < wordArray.length; i++) {
        if(!(words.includes(wordArray[i]))){
            words.push(wordArray[i]);
        }
    }

    // wordCounterOfTheStory : hakeyediki kelimelerin tekrar sayısı dizisi.
    // indexler tekrarsız kelimeler dizisine denk gelir.
    let wordCounterOfTheStory = new Array(words.length);
    wordCounterOfTheStory.fill(0);
    for (let i = 0; i < wordArray.length; i++) {
        wordCounterOfTheStory[words.indexOf(wordArray[i])]++;
    }

    // numberOfWordsInTheStory : kelimelerin tekrar sayısı bilgisi string olarak oluşturuldu. arayüz için.
    let numberOfWordsInTheStory = '';
    for(let i = 0 ; i< words.length;i++){
        if(wordCounterOfTheStory[i] != 1){
            const word = words[i];
            const times = wordCounterOfTheStory[i];                                    
            numberOfWordsInTheStory+=word.toString() + ' : ' + times.toString() + 'x, ';            
        }
    }
    numberOfWordsInTheStory = numberOfWordsInTheStory.slice(0, -2);
    data.numberOfWordsInTheStory = numberOfWordsInTheStory;

    // veritabanından spamler çekiliyor.
    const spamsPromise = Spam.find({},'chatId content contentHash').exec();
    spamsPromise.then(function (spams) {
        if(spams.length>2){
            // words_Spams2DArray 2 boyutlu bir dizi. 
            // Birinci boyutunun uzunluğu tekrarsız kelime sayısı kadar.
            // İkinci boyutunun uzunluğu veritabanındaki spam sayısı kadar.
            // Amaç her spam mesajının her kelimeyi kaç kez tekrar ettiğini tutmak.
            let words_Spams2DArray = new Array(words.length); 
            for (let i = 0; i < spams.length; i++) {
                words_Spams2DArray[i] = new Array(words.length); 
            } 
            for (let i = 0; i < spams.length; i++) {
                words_Spams2DArray[i].fill(0); 
            }

            // analysisOfSpam her spamin analizlerini tutulduğu dizi.
            let analysisOfSpam = new Array();

            for(let i = 0 ; i < spams.length ; i++){

                analysisOfSpam[i] = new Object();
                analysisOfSpam[i].content=spams[i].content;
                analysisOfSpam[i].contentHash=spams[i].contentHash;
                // spamin analiz için şifresi çözülüyor.
                const chatPromise = AESChat.findOne({_id : spams[i].chatId}).exec();
                chatPromise.then(function (chat) {

                    let decrypted = CryptoJS.AES.decrypt(spams[i].content, chat.key).toString(CryptoJS.enc.Utf8);                            
                    analysisOfSpam[i].decryptedMessage=decrypted;
                    let decryptedMessageWords = decrypted.split(" ");
                    // spamin her kelimesinin kaç kez tekrar ettiği words_Spams2DArray'e kaydediliyor.
                    for(let j = 0 ; j<decryptedMessageWords.length;j++){
                        if(decryptedMessageWords[j] != ''){
                            // i. spamin j. wordü 1 artır.
                            words_Spams2DArray[i][words.indexOf(decryptedMessageWords[j])]++;                               
                        }                            
                    }
                    // numberOfWordsInTheSpam : spamin kelimelerinin arayüzde gösterilmesi için bir string hazırlanıyor.
                    analysisOfSpam[i].numberOfWordsInTheSpam = '';
                    for(let j = 0 ; j < words.length ; j++){
                        if(words_Spams2DArray[i][j] != 0){
                            const word = words[j];
                            const times = words_Spams2DArray[i][j];                                    
                            analysisOfSpam[i].numberOfWordsInTheSpam+=word.toString() + ' : ' + times.toString() + 'x, ';                            
                        }                            
                    }
                    analysisOfSpam[i].numberOfWordsInTheSpam = analysisOfSpam[i].numberOfWordsInTheSpam.slice(0, -2);  

                    // Eğer bütün spamlar analiz edildiyse
                    if(i==(spams.length-1)){
                        // En benzer iki spam bulunuyor.
                        let indexOfMostSimilarSpam1,indexOfMostSimilarSpam2;
                        let similarityScoreOfSpams = similarity(words_Spams2DArray[0],words_Spams2DArray[1]);
                        for(let k=0;k<(spams.length-1);k++){
                            for(let l=k+1;l<spams.length;l++){
                                if(similarity(words_Spams2DArray[k],words_Spams2DArray[l]) >= similarityScoreOfSpams){
                                    similarityScoreOfSpams = similarity(words_Spams2DArray[k],words_Spams2DArray[l]);
                                    indexOfMostSimilarSpam1=k;
                                    data.indexOfMostSimilarSpam1=indexOfMostSimilarSpam1;
                                    indexOfMostSimilarSpam2=l;
                                    data.indexOfMostSimilarSpam2=indexOfMostSimilarSpam2;
                                    data.similarityScoreOfSpams=similarityScoreOfSpams
                                }
                            }
                        }
            
                        // En benzer iki spamin özetlerinin benzerliği bulunuyor.
                        let hashOfSimilarSpam1 = spams[indexOfMostSimilarSpam1].contentHash.toString(CryptoJS.enc.Hex);
                        let hashOfSimilarSpam2 = spams[indexOfMostSimilarSpam2].contentHash.toString(CryptoJS.enc.Hex);
                        let hashSimilarityScore = stringSimilarity.compareTwoStrings(hashOfSimilarSpam1, hashOfSimilarSpam2); 
                        data.hashSimilarityScore = hashSimilarityScore;
            
                        // Bütün spamlerin kelimelerine bakılarak hangi kelime toplamda kaç kez rastgele üretilmiş onu gösteren bir grafik oluşturuldu.
                        // wordCounter : grafikteki her kelimenin kaç kez tekrar ettiği verisi için.
                        let wordCounter = new Array(words.length);
                        wordCounter.fill(0);
                        for(let k=0;k<words.length;k++){
                            for(let l=0;l<spams.length;l++){
                                wordCounter[k] +=words_Spams2DArray[l][k];
                            }
                        }            

                        // words : grafikteki kelimeler için.
                        data.words = JSON.stringify(words);
                        data.wordCounter = JSON.stringify(wordCounter);
                        data.analysisOfSpam = analysisOfSpam;
                        res.render('spam-analysis',data);
                    }
                });
            }
        }
        else{
            res.render('spam-analysis', { warning: 'no-spam'});
        }
    });
}

getRSAChatingDefault = function(req,res){

    if(req.session.user){

        let data = new Object();

        const sessionUserPromise = User.findOne({username: req.session.user}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });  

        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;     
            res.render('rsa-chating', data);       
        });   

    } else {
        res.redirect('/login');
    }

}

getRSAChatingWithUser = function(req,res){
    if(req.session.user){
        
        let data = new Object();
        const sessionUsername = req.session.user;
        const targetUsername = req.params.username;

        let sessionPublicKey;
        const sessionUserPromise = User.findOne({username: sessionUsername}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;

            const sessionPEMStringPromise = RSAKey.findOne({userId: user._id}).exec();
            sessionPEMStringPromise.then(function (userKeys) {
                if(userKeys == null){
                    res.render('error', { type: 'danger', title:'getRSAChatingWithUser userKeys == null', errorMessage:"Session user key bulunamadi."});
                }
                else{
                    sessionPublicKey = userKeys.publicKey;
                }
            });   
        });

        let targetUserPublicKey;
        const targetUserPromise = User.findOne({username : targetUsername}).exec();
        targetUserPromise.then(function (user) {
            data.targetUsername = user.username;

            const targetUserPEMStringPromise = RSAKey.findOne({userId: user._id}).exec();
            targetUserPEMStringPromise.then(function (userKeys) {
                if(userKeys == null){
                    res.render('error', { type: 'danger', title:'getRSAChatingWithUser userKeys == null', errorMessage:"target user key bulunamadi."});
                }
                else{
                    targetUserPublicKey = userKeys.publicKey;
                }
            });   
        });

        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;
        });

        let keyString; // her chat için kullanıcı adlarından oluşan bir string
        if(sessionUsername.localeCompare(targetUsername) == -1){
            keyString = sessionUsername + targetUsername;
        }
        else{
            keyString = targetUsername + sessionUsername;
        }

        const focusChatPromise = RSAChat.findOne({idString : keyString}).exec();
        focusChatPromise.then(function (focusChat) {
            if(focusChat == null){

                let newChatObj = {
                    idString : keyString,
                    user1 : sessionUsername,
                    user2 : targetUsername
                }

                const newChat = new RSAChat(newChatObj);
                newChat.save(function(err){
                    if(err){
                        res.render('error', { type: 'danger', title:'getRSAChatingWithUser() newChat.save', errorMessage:err });
                    }else{
                        res.render('rsa-chating', data);
                    }                  
                });
            }
            else{
                const messagesPromise = RSAMessage.find({chatId : focusChat._id}).exec();
                messagesPromise.then(function (messages) {
                    if(messages[0] != null){
                        for(let i = 0; i<messages.length;i++){    
                            if(sessionUsername == messages[i].toUser || sessionUsername == messages[i].fromUser){
                                // şifre çözme
                                let decrypted;
                                if(messages[i].fromUser == sessionUsername){
                                    const key = new NodeRSA({b: 512});
                                    try {
                                        key.importKey(sessionPublicKey,'public');
                                        decrypted = key.decryptPublic(messages[i].content, 'utf8');
                                    } catch (error) {
                                        decrypted = 'error';
                                    }
                                }
                                else if(messages[i].fromUser == targetUsername){
                                    const key = new NodeRSA({b: 512});
                                    try {
                                        key.importKey(targetUserPublicKey,'public');
                                        decrypted = key.decryptPublic(messages[i].content, 'utf8');
                                    } catch (error) {
                                        decrypted = 'error';
                                    }                                    
                                }
                                if(decrypted == 'error'){
                                    messages[i].content = "Mesaj farklı birisi tarafından imzalanmış ve ya mesajın içeriği değiştirilmiş."
                                }
                                else{
                                    // hash kontrol
                                    if(messages[i].contentHash == CryptoJS.SHA256(decrypted).toString(CryptoJS.enc.Hex) ){
                                        messages[i].content = decrypted;
                                        let date = new Date;
                                        date.setTime(messages[i].created_at);
                                        const tempMinutes =date.getMinutes()<10?'0':'';
                                        const minute =tempMinutes + date.getMinutes();
                                        const tempHours =date.getHours()<10?'0':'';
                                        const hour =tempHours + date.getHours();
                                        const month = months[date.getMonth()];
                                        messages[i].time = date.getDate() + ' ' + month + ' ' +date.getFullYear() + ' ' + hour + ':' + minute ;
                                    }
                                    else{
                                        messages[i].content = "Mesaj farklı birisi tarafından imzalanmış ve ya mesajın içeriği değiştirilmiş."
                                    }
                                }
                            }
                        }                                
                        data.messages = messages;  
                    }
                    res.render('rsa-chating',data);
                });
            }
        });

    } else {
        res.redirect('/login');
    }
}

getSendImage = function(req,res){
    if(req.session.user){
        let data = new Object();
        const sessionUsername = req.session.user;
        const sessionUserPromise = User.findOne({username: sessionUsername}).exec();
        sessionUserPromise.then(function (user) {
            data.sessionUsername = user.username;
        });

        //AESChat yoksa oluşturuluyor.
        const allUsersPromise = User.find({},'username').exec();
        allUsersPromise.then(function (users) {
            data.users = users;
            if(users.length>1){
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    if(sessionUsername == user.username){
                        continue;
                    }
                    let keyString; // her chat için kullanıcı adlarından oluşan bir string
                    if(sessionUsername.localeCompare(user.username) == -1){
                        keyString = sessionUsername + user.username;
                    }
                    else{
                        keyString = user.username + sessionUsername;
                    }

                    const focusChatPromise = AESChat.findOne({idString : keyString}).exec();
                    focusChatPromise.then(function (chat) {
                        const hashedKey =  CryptoJS.SHA256(keyString);
                        if(chat == null){

                            let newChatObj = {
                                idString : keyString,
                                user1 : sessionUsername,
                                user2 : user.username,
                                key : hashedKey
                            }

                            const newChat = new AESChat(newChatObj);
                            newChat.save(function(err){
                                if(err){
                                    res.render('error', { type: 'danger', title:'getAESChatingWithUser() newChat.save', errorMessage:err });
                                }else{
                                    console.log("chat oluşturuldu.");
                                }                  
                            });
                        }
                    });
                    
                }
            }
            else{
                res.redirect('register');
            }
        });

        //image dataları toplanıyor.

        const allImagesPromise = Image.find({}).exec();
        allImagesPromise.then(function (images) {
            if(images[0] != null){
                data.images = images;
                for (let i = 0; i < images.length; i++) {

                    const url = images[i].imageUrlBack; // veritabanından imaj yolu alınıyor.
                    const image = fs.readFileSync(url) // imaj dosyası okunuyor. image'e atılıyor.
                    const revealed = steggy.reveal(image) // içine gizlenmiş veri revealed ' a atılıyor.
                    let message=revealed.toString();
                    data.images[i].encryptedMessage=message; // şifreli metin.
                    // image in chatId sine bakılıp o chatin keyinden decrypt ediliyor. şayet kullanıcıların erişim izni varsa.
                    
                        const chatPromise = AESChat.findOne({_id : images[i].chatId}).exec();
                        chatPromise.then(function (chat) {
                            if(images[i].toUser == sessionUsername || images[i].fromUser == sessionUsername){
                                const decrypted = CryptoJS.AES.decrypt(message, chat.key).toString(CryptoJS.enc.Utf8);
                                data.images[i].decryptedMessage=decrypted; 
                            }                           
                                 
                            if(i==(images.length-1)){
                                res.render('send-image', data);
                            }                  
                        });
                }
            }else{
                res.render('send-image', data);
            }
        });

    } else {
        res.redirect('/login');
    }
}


postIndex = function(req,res){    
    if(req.body.processType == 'encryption'){
        if(req.body.test_plain_text == '' || req.body.test_key == ''){
            res.render('index',{status: 'statusAlert', type: 'warning', message:'Plain Text ve Key alanlarını doldurunuz.' });
        }
        else{
            const plainText = req.body.test_plain_text;
            const key = req.body.test_key;
            const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
            res.render('index',{enc_plain_text : plainText , enc_key : key , enc_cipher_text : encrypted , scroll_down : 'result_cipher'});
        }
    }
    else if(req.body.processType == 'decryption'){
        if(req.body.test_cipher_text == '' || req.body.test_key == ''){
            res.render('index',{status: 'statusAlert', type: 'warning', message:'Cipher Text ve Key alanlarını doldurunuz.' });
        }
        else{
            const cipherText = req.body.test_cipher_text;
            const key = req.body.test_key;
            const decrypted = CryptoJS.AES.decrypt(cipherText, key).toString(CryptoJS.enc.Utf8);
            res.render('index',{dec_cipher_text : cipherText , dec_key : key , dec_plain_text : decrypted , scroll_down : 'result_plain'});
        }
    }
}

postLogin = function (req,res) {
    const userPromise = User.findOne({ username: req.body.username }).exec();
    userPromise.then(function (user) {
        if(user === null){
            res.render('login', { status: 'statusAlert', type: 'warning', message:'Böyle bir kullanıcı yok.' });
        }
        else{                
            if(CryptoJS.SHA256(req.body.password).toString(CryptoJS.enc.Hex) == user.password) {                    
                req.session.user = req.body.username;
                res.redirect('/');
            }
            else {
                res.render('login', { status: 'statusAlert', type: 'warning', message:'Parola yanlış.' });
            }
        }
    });    
}

postRegister = function(req,res){
    const userPromise = User.findOne({ username: req.body.username }).exec();
    userPromise.then(function (user) {
        if(user === null){
            if(req.body.username == '' || req.body.password == ''){
                res.render('register', { status: 'statusAlert', type: 'warning', message:'Boş alan bırakmayın.' });
            }
            else{
                const hashedPassword = CryptoJS.SHA256(req.body.password);
                const newUserObj = {
                    username: req.body.username,
                    password: hashedPassword
                }
                const newUser = new User(newUserObj);
                newUser.save(function(err,user){
                    if(err){
                        res.render('error', { type: 'danger', title:'postRegister newUser.save', errorMessage:err });
                    }else{
                        // Hesap kaydedildikten sonra rsa için public ve private keyleri veritabanına kaydediliyor.
                        const key = new NodeRSA({b: 512});
                        const privateKey = key.exportKey('private');
                        const publicKey = key.exportKey('public');
                        const newKeyObj = {
                            userId : user._id,
                            privateKey : privateKey,
                            publicKey : publicKey
                        }                
                        const newKey = new RSAKey(newKeyObj);
                        newKey.save(function(err){
                            if(err){
                                res.render('error', { type: 'danger', title:'postRegister newKey.save', errorMessage:err });
                            }     
                            else{
                                res.redirect('login');
                            }          
                        });
                    }                  
                });                
            }
        }
        else{                
            res.render('register', { status: 'statusAlert', type: 'danger', message:'Bu kullanıcı adı kullanılıyor.' });
        }
    });    
}

postAESChating = function(req,res){
    const sessionUsername = req.session.user;
    const targetUsername = req.body.target_username;

    let keyString;
    if(sessionUsername.localeCompare(targetUsername) == -1){
        keyString = sessionUsername + targetUsername;
    }
    else{
        keyString = targetUsername + sessionUsername;
    }

    const focusChatPromise = AESChat.findOne({idString : keyString}).exec();
    focusChatPromise.then(function (focusChat) {
        if(focusChat == null){                    
            res.render('error', { type: 'danger', title:'postAESChating focusChat == null ', errorMessage:"Focus chat bulunamadı." });
        }
        else{
            const message = req.body.message_text;
            const encryptedMessageContent = CryptoJS.AES.encrypt(message, focusChat.key).toString();
            const newMessageObj = {
                chatId : focusChat._id,
                fromUser : sessionUsername,
                toUser : targetUsername,
                content : encryptedMessageContent
            }                
            const newMessage = new AESMessage(newMessageObj);
            newMessage.save(function(err){
                if(err){
                    res.render('error', { type: 'danger', title:'postAESChating newMessage.save', errorMessage:err });
                }else{
                    res.redirect('/aes-chating/'+targetUsername);
                }                  
            });
        }
    });
}

postSendSpam = function(req,res){
    const sessionUsername = req.session.user;
    const targetUsername = req.body.target_username;
    let keyString;
    if(sessionUsername.localeCompare(targetUsername) == -1){
        keyString = sessionUsername + targetUsername;
    }
    else{
        keyString = targetUsername + sessionUsername;
    }
    const focusChatPromise = AESChat.findOne({idString : keyString}).exec();
    focusChatPromise.then(function (chat) {
        if(chat == null){                    
            res.render('error', { type: 'danger', title:'postSendSpam() chat==null', errorMessage:"focus chat bulunamadı." });
        }
        else{
            const message = req.body.message_text;
            const encryptedMessage = CryptoJS.AES.encrypt(message, chat.key).toString();
            const hashedEncryptedMessage = CryptoJS.SHA256(encryptedMessage);
            const newSpamObj = {
                chatId : chat._id,
                fromUser : sessionUsername,
                toUser : targetUsername,
                content : encryptedMessage,
                contentHash : hashedEncryptedMessage
            }                
            const newSpam = new Spam(newSpamObj);
            newSpam.save(function(err){
                if(err){
                    res.render('error', { type: 'danger', title:'postSendSpam() newSpam.save', errorMessage:err });
                }else{
                    res.redirect('/send-spam/'+targetUsername);
                }                  
            });
        }
    });
}

postRSAChating = function(req,res){
    const sessionUsername = req.session.user;
    const targetUsername = req.body.target_username;

    let keyString;
    if(sessionUsername.localeCompare(targetUsername) == -1){
        keyString = sessionUsername + targetUsername;
    }
    else{
        keyString = targetUsername + sessionUsername;
    }

    const focusChatPromise = RSAChat.findOne({idString : keyString}).exec();
    focusChatPromise.then(function (focusChat) {
        if(focusChat == null){                    
            res.render('error', { type: 'danger', title:'postRSAChating focusChat == null ', errorMessage:"Focus chat bulunamadı." });
        }
        else{
            const message = req.body.message_text;
            const messageHash = CryptoJS.SHA256(message);

            const sessionUserPromise = User.findOne({username: sessionUsername}).exec();
            sessionUserPromise.then(function (user) {
                const sessionPEMStringPromise = RSAKey.findOne({userId: user._id}).exec();
                sessionPEMStringPromise.then(function (userKeys) {
                    if(userKeys == null){
                        res.render('error', { type: 'danger', title:'postRSAChating userKeys == null', errorMessage:"Session user key bulunamadi."});
                    }
                    else{
                        sessionPrivateKey = userKeys.privateKey;                        
                        const key = new NodeRSA({b: 512});
                        const mitmIsCheck = req.body['man_in_the_middle'];
                        if(!mitmIsCheck){
                            // aradaki adama gönderilmemişse
                            key.importKey(sessionPrivateKey,'private');
                        }
                        const encryptedMessageContent = key.encryptPrivate(message, 'base64');

                        const newMessageObj = {
                            chatId : focusChat._id,
                            fromUser : sessionUsername,
                            toUser : targetUsername,
                            content : encryptedMessageContent,
                            contentHash : messageHash,
                        }
                        const newMessage = new RSAMessage(newMessageObj);
                        newMessage.save(function(err){
                            if(err){
                                res.render('error', { type: 'danger', title:'postRSAChating newMessage.save', errorMessage:err });
                            }else{
                                res.redirect('/rsa-chating/'+targetUsername);
                            }                  
                        });
                    }
                });   
            });
            
        }
    });
}

postSendImage = function(req,res){
    
    if(req.session.user){
        
        let data = new Object();

        const sessionUsername = req.session.user;
        const targetUsername = req.body.target_username; 

        const allImagesPromise = Image.find({},'_id').exec();
        allImagesPromise.then(function (dbImages) {
            dbImagesLength = dbImages.length;

            let keyString; // her chat için kullanıcı adlarından oluşan bir string
            if(sessionUsername.localeCompare(targetUsername) == -1){
                keyString = sessionUsername + targetUsername;
            }
            else{
                keyString = targetUsername + sessionUsername;
            }
            console.log('keyString : ' +keyString);
            const focusChatPromise = AESChat.findOne({idString : keyString}).exec();
            focusChatPromise.then(function (chat) {
                if(chat == null){                    
                    res.render('error', { type: 'danger', title:'postSendImage() chat==null', errorMessage:"chat bulunamadı." });
                }
                else{
                    // arayüzden alınan fotoğraf /publi/img/postimages/ altına kaydediliyor.
                    let image = req.files.image;
                    image.name = `${dbImages.length}.png`;
                    const url = path.resolve(__dirname,'../../public/img/postimages', image.name);
                    image.mv(url);

                    // 0,1,2, diye gidecek ayarda isimlendirme yapılıyor.
                    const pngUrl = path.resolve(__dirname,'../../public/img/postimages', `${dbImages.length}.png`); 
                    // watermak için özellikler ayarlanıyor.
                    const watermarkOptions = {
                        'text' : req.session.user,
                        'color' : 'rgba(255,255,255,0.3)',
                        'scale' : '50%'
                    };     
                    // watermark ekleniyor.           
                    watermark.addWatermark(pngUrl, watermarkOptions, function(err){
                        if(err){
                            return console.log(err);
                        }
                        else{
                            // watermark eklenmişse steganografi işlemleri uygulanıyor.
                            const watermarkedImgUrl = path.resolve(__dirname,'../../public/img/postimages', `watermark_${dbImages.length}.png`);
                            const original = fs.readFileSync(watermarkedImgUrl); //watermark eklenmiş imaj alınıyor.
                            const message = req.body.message_text; // arayüzden mesaj alınıyor.
                            // encryption
                            const encryptedMessageContent = CryptoJS.AES.encrypt(message, chat.key).toString();
                            // steganografi
                            const concealed = steggy.conceal(original, encryptedMessageContent );
                            const concealedImgUrl = path.resolve(__dirname,'../../public/img/postimages', `concealed_${dbImages.length}.png`);
                            const dbConcealedImgUrl = `/public/img/postimages/concealed_${dbImages.length}.png`;
                            fs.writeFileSync(concealedImgUrl, concealed);  
                            const newImageObj = {
                                chatId : chat._id,
                                fromUser : sessionUsername,
                                toUser : targetUsername,
                                imageUrlFront : dbConcealedImgUrl,
                                imageUrlBack : concealedImgUrl,
                            }

                            const newImage = new Image(newImageObj);
                            newImage.save(function(err){
                                if(err){
                                    res.render('error', { type: 'danger', title:'postSendImage() newImage.save', errorMessage:err });
                                }else{
                                    res.redirect('/');
                                }                  
                            });

                        }
                    });
                }
            });
        });
    } else {
        res.redirect('/login');
    }
}
    
router.get('/',getIndex);
router.get('/aes-chating',getAESChatingDefault);
router.get('/aes-chating/:username',getAESChatingWithUser);
router.get('/send-spam',getSendSpamDefault);
router.get('/send-spam/:username',getSendSpamWithUser);
router.get('/aes-chats',getAESChatsDefault);
router.get('/aes-chats/:chatId',getAESChatsWithUser);
router.get('/login',getLogin);
router.get('/register',getRegister);
router.get('/spam-analysis',getSpamAnalysis);
router.get('/rsa-chating',getRSAChatingDefault);
router.get('/rsa-chating/:username',getRSAChatingWithUser);
router.get('/send-image',getSendImage);

router.post('/',postIndex);
router.post('/login',postLogin);
router.post('/register',postRegister);
router.post('/aes-chating',postAESChating);
router.post('/send-spam',postSendSpam);
router.post('/rsa-chating',postRSAChating);
router.post('/send-image',postSendImage);

module.exports = router;