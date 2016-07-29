var apiKey ;
if(apiKey){
 var googleTranslate = require('google-translate')(apiKey);
 googleTranslate.translate('My name is Brandon', 'es', function(err, translation) {
   console.log(translation.translatedText);
   // =>  Mi nombre es Brandon
 });
}else{
  console.log('Please set the API Key');
}
