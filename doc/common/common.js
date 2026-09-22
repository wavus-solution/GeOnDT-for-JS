let getTimeStr =function (){
    let today = new Date();
    return '['+today.getHours() + ':' +  today.getMinutes()  + ':' + today.getSeconds() + ':' + today.getMilliseconds() + ']';
}