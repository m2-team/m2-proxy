"use strict";
let http = require("http");
let PROXYPORT = 8000;

http.createServer(function(request, response){
    let HOST = request.headers.host;
    let URL = request.url;
    let TYPE = getType(HOST, URL);
    if(TYPE == "PROXY"){
        // 1. 解析请求内容，构建远端请求对象
        var opt = {
            host : 'localhost',
            port : '80',
            method : request.method,
            path : '/',
            headers : request.headers
        };
        var hostArray = HOST.split(":");
        opt.host = hostArray[0];
        if(hostArray.length>1){
            opt.port = hostArray[1];
        }
        var urlArray = request.url.split('/');
        if(urlArray.length>2){
            for (var i = 3; i < urlArray.length; i++) {
                opt.path += "/" + urlArray[i];
            };
        }else{
            opt.path = "/";
        }
        // 2. 发起请求，将内容转发给客户端
        var serverReq = http.request(opt, function(serverRes) {
            response.writeHead(serverRes.statusCode, serverRes.headers);
            serverRes.on('data',function(d){
                response.write(d);
            }).on('end', function(){
                response.end();
            });

        }).on('error', function(e) {
            // TODO 需要做异常处理
            console.log(request.url);
            console.log(e);
        });
        serverReq.end();
    }else if(TYPE == "STATIC"){
        response.writeHead(200, {});
        response.write("设置命令：networksetup -setwebproxy USB\\ Ethernet 127.0.0.1 8000\n");
        response.end("关闭代理设置：networksetup -setwebproxystate USB\\ Ethernet off\n");
    }else if(TYPE == "DIRECTION"){
        response.writeHead(200, {});
        response.end("代理设置命令\n");
    }
}).listen(PROXYPORT);

/**
 * 获取类型
 * @param  {[string]} HOSTINFO  [传入的HOST名称]
 * @param  {[string]} URL       [传入的URL地址，用于区分指令和静态页面请求]
 * @return {[string]}           获取类型： STATIC, PROXY, DIRECTION
 * STATIC: 静态资源请求
 * PROXY: 代理请求
 * DIRECTION: 代理信息查看和设置请求
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
        // TODO ： 需要根据URL来判断是Web资源请求还是代理查询、处理指令
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
