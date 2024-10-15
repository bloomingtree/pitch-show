function formatDate(now) {
    var year = now.getFullYear()
    var month = now.getMonth() + 1
    var date = now.getDate()
    var hour = now.getHours()
    var minute = now.getMinutes()
    var second = now.getSeconds()
    return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second
//      return[year,month,date].join('-')+' '+[hour,minute,second].join(':'); //这种写法也很赞
}
export default {
    formatDate,
}