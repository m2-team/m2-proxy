"use strict";
let http = require("http");
let PROXYPORT = 8000;

http.createServer(function(request, response){
    let HOST = request.headers.host;
    let URL = request.url;
    let TYPE = getType(HOST, URL);
    console.log(TYPE);
    response.writeHead(200, {});
    response.end("Hey Oh!\n");
}).listen(PROXYPORT);
/**
 * 获取类型
 * @param  {[string]} HOST    [传入的HOST名称]
 * @param  {[string]} URL     [传入的URL地址]
 * @return {[string]}         获取类型： STATIC, PROXY, DIRECTION
 * STATIC: 静态资源请求
 * PROXY: 代理请求
 * DIRECTION: 代理设置请求
 */
var getType = function(HOSTINFO, URL){
    var type = "PROXY";
    let HostInfoArray = HOSTINFO.split(":");
    let hostName = HostInfoArray[0];
    var port = 80;
    if(HostInfoArray.length>1){
        port = HostInfoArray[1];
    }
    if(HostUtil.isLocalhost(hostName)
       && port==PROXYPORT){
        // 若为本地hostname和本地代理服务器监听的端口号
        // 则类型为STATIC
        // TODO ： 需要监听一些命令
        type = "STATIC";
    }
    return type;
};
var HostUtil = {
    _hosts : [],
    getAll : function(){
        let os = require("os");
        if(this._hosts.length>0){
            return this._hosts;
        }
        this._hosts.push(os.hostname());
        let interfaces = os.networkInterfaces();
        // 将所有当前系统已获得的IP地址加入列表中
        for(var i in interfaces){
            let item = interfaces[i];
            for (var i = 0; i < item.length; i++) {
                if(item[i].family=="IPv4"){
                    this._hosts.push(item[i].address);
                }
            }
        }
        return this._hosts;
    },
    isLocalhost : function(host){
        var LOCALS = this.getAll();
        for (var i = 0; i < LOCALS.length; i++) {
            if(LOCALS[i] == host){
                return true;
            }
        };
        return false;
    }
}
