(function(){
  var initialized=false;
  function doInit(){
    var phoneEl=document.getElementById('phone');
    if(!phoneEl||!window.intlTelInput) return;
    window.itiPhone=window.intlTelInput(phoneEl,{
      initialCountry:'auto',
      allowDropdown:true,
      showFlags:true,
      separateDialCode:false,
      nationalMode:true,
      formatOnDisplay:false,
      autoPlaceholder:'polite',
      preferredCountries:['us','de','es','pt','fr','gb'],
      utilsScript:'https://cdn.jsdelivr.net/npm/intl-tel-input@latest/build/js/utils.js',
      geoIpLookup:function(cb){
        fetch('https://ipapi.co/json').then(function(res){return res.json();}).then(function(data){cb(data&&data.country_code?data.country_code:'US');}).catch(function(){cb('US');});
      }
    });
    
    function formatInput(){
      var currentValue = phoneEl.value || '';
      
      // Use the library's built-in formatting instead of custom logic
      try {
        if (window.itiPhone) {
          var formattedNumber = window.itiPhone.getNumber();
          if (formattedNumber && formattedNumber !== currentValue) {
            phoneEl.value = formattedNumber;
          }
        }
      } catch(e) {
        console.error('Error formatting phone number:', e);
      }
    }
    
    try{
      phoneEl.addEventListener('countrychange', formatInput);
      phoneEl.addEventListener('blur', formatInput);
    }catch(e){}
    
    initialized=true;
  }
  window.CountryPhoneCode={
    init:function(){
      if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',doInit);}else{doInit();}
    },
    onBeforeSubmit:function(){
      var phoneEl=document.getElementById('phone');
      if(window.itiPhone&&phoneEl){
        // Get the full international number with country code
        var fullPhone=window.itiPhone.getNumber();
        
        // If getNumber doesn't return a valid number, manually add country code
        if(!fullPhone && phoneEl.value){
          var countryData=window.itiPhone.getSelectedCountryData()||{};
          var dialCode=countryData.dialCode||'';
          var digits=phoneEl.value.replace(/[^\d]/g,'');
          
          // Remove any existing country code to avoid duplicates
          if(dialCode && digits.indexOf(dialCode)===0){
            digits=digits.slice(dialCode.length);
          }
          
          // Format with country code
          fullPhone = dialCode ? '+' + dialCode + ' ' + digits : '+' + digits;
        }
        
        phoneEl.value=fullPhone||phoneEl.value;
      }
    }
  };
  window.CountryPhoneCode.init();
})();