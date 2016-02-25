"use strict";
let http = require("http");
// let os =  require("os");
let fs = require("fs");
let PROXYPORT = 8000;

let server = http.createServer(function(request, response){
    let HOST = request.headers.host;
    let URL = request.url;
    let TYPE = getType(HOST, URL);
    if(TYPE == "PROXY"){
        var data = "";//存放POST的数据内容
        request.on("data", function(d){
            data = d.toString("utf-8");
        }).on("end", function(){
            // 1. 解析请求内容，构建远端请求对象
            var opt = {
                host : 'localhost',
                port : '80',
                method : request.method,
                path : '',
                headers : request.headers
            };
            var hostArray = HOST.split(":");
            opt.host = hostArray[0];
            if(hostArray.length>1){
                opt.port = hostArray[1];
            }
            var urlArray = request.url.split('/');
            if(urlArray.length>3){
                for (var i = 3; i < urlArray.length; i++) {
                    opt.path += "/" + urlArray[i];
                };
            }
            // 2. 发起请求，将内容转发给客户端
            var serverReq = http.request(opt, function(serverRes) {
                response.writeHead(serverRes.statusCode, serverRes.headers);
                serverRes.on('data',function(d){
                    response.write(d);
                    // console.log(serverRes.headers, d.toString("utf-8"));
                }).on('end', function(){
                    response.end();
                });
            }).on('error', function(e) {
                if(e.errno=="ETIMEDOUT"){
                    // 超时处理
                    response.writeHead(504, {});
                    response.end(e.message);
                }else{
                    // 作为网关或者代理工作的服务器尝试执行请求时
                    // 从上游服务器接收到无效的响应
                    response.writeHead(502, {});
                    response.end(e.message);
                }
                console.log(request.url, e);
            });
            if(request.method=="POST"){
                // console.log(request.url, data.toString("utf-8"));
                serverReq.write(data);
            }
            serverReq.end();
        });
    }else if(TYPE == "STATIC"){
        response.writeHead(200, {
            "Content-Type" : "text/html;charset=utf-8"
        });
        // TODO 1. here should be modified by request url
        // TODO 2. and should close connection correctly
        var fileName = "static/index.html";
        fs.readFile(fileName, function(err, data){
            if(!err){
                response.write(data);
                response.end();
            }
        });
    }else if(TYPE == "DIRECTION"){
        response.writeHead(200, {});
        response.end("代理设置命令\n");
    }
}).listen(PROXYPORT);
console.log("http://localhost:"+PROXYPORT+"/");
/**
 * 获取类型
 * @param  {[string]} HOSTINFO  [传入的HOST名称]
 * @param  {[string]} URL       [传入的URL地址，用于区分指令和静态页面请求]
 * @return {[string]}           获取类型： STATIC, PROXY, DIRECTION, MODIFY
 * STATIC: 静态资源请求
 * PROXY: 一般代理请求
 * DIRECTION: 代理信息查看和设置请求
 * MODIFY: 修改用户请求
 */
var getType = function(hostAndPort, URL){
    var type = "PROXY";
    let HostInfoArray = hostAndPort.split(":");
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
var wsClients = [];
// ws服务器用于与客户端通信
// 发送收到的请求信息
let WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server });
wss.on('connection', function connection(ws) {
    wsClients.push(ws);
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });
    ws.send(JSON.stringify({
        content : 1
    }));
    ws.on('close', function(e){
        console.log("closed" + e);
    });
});