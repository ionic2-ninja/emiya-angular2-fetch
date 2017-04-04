'use strict'
import {Token} from 'emiya-angular2-token'
import {Utils} from 'emiya-js-utils'
import {Injectable} from '@angular/core';
import {Http, URLSearchParams, Headers} from '@angular/http';

const constants = {
    tokenStorageMethod: 'local',
    httpRequestTimeout: 30000,
    background_interface_type: undefined,
    proxies: undefined
};

@Injectable()
export class Fetch {

    private token = Token
    private utils = Utils;
    private proxyCanEnable;
    private api

    private static decorators = [
        {type: Injectable},
    ];
    private static ctorParameters = [
        {type: Http,},
    ];

    constructor(private Http: Http) {
        if(window['cordova'])
            this.proxyCanEnable = false;
        else
            this.proxyCanEnable = true;
        // if (this.platform.platforms().indexOf('cordova') >= 0)
        //     this.proxyCanEnable = false;
        // else
        //     this.proxyCanEnable = true;
        // let d={}
        // for(let c in api.interfaceMap){
        //   d[api.interfaceMap[c].id]=api.interfaceMap[c]
        //   delete d[api.interfaceMap[c].id].id
        // }
        // console.log(JSON.stringify(d))
    }

    public load(id, config, proxy?) {
        constants.background_interface_type = id
        this.api = config
        if (proxy) {
            constants['proxies'] = {}
            if (proxy instanceof Array)
                constants['proxies']['configs'] = proxy
            else
                constants['proxies']['configs'] = [proxy]
        }
    }

    public setTimeoutLimit(mili = 15000) {
        constants.httpRequestTimeout = mili
    }

    public getProxyConfig() {
        if (constants.proxies && constants.proxies.configs && constants.proxies.configs.length > 0) {
            var inner = this.utils.deepCopy(constants.proxies.configs);
            var d = inner.length;
            for (var c in inner) {
                inner[c].pathDept = this.utils.countStr(inner[c].path, '/');
                inner[c].pathLength = (inner[c].path).length;
                inner[c].index = (d--);
            }
            ;
            return this.utils.sortObject(inner, ['pathDept', 'pathLength', 'index'], false)
            //return $filter('orderBy')(inner, ['pathDept', 'pathLength', 'index'], true);
        }
        else
            return [];
    };

    public transformHeaders(headers) {
        let newP = {}
        headers.forEach((...arg)=> {
            newP[arg[1]] = arg[0][0]
        })
        return newP
    }

    public transformParams(params) {
        let newP = {}, url = params.url;
        if (params.headers) {
            newP['headers'] = new Headers();
            for (let c in params.headers) {
                newP['headers'].set(c, params.headers[c])
            }
        }
        if (params.data) {
            newP['body'] = params.data
        }
        if (params.params) {
            newP['search'] = new URLSearchParams();
            for (let c in params.params) {
                if (!(params.params[c] instanceof Array))
                    newP['search'].set(c, params.params[c])
                else {
                    let arrayP = params.params[c], query = '';
                    delete params.params[c];
                    let prefix = '';
                    if (url.indexOf('?') >= 0 && url.substr(url.length - 1, 1) != '?')
                        prefix = '&';
                    else if (url.indexOf('?') < 0)
                        prefix = '?';

                    for (let e in arrayP) {

                        query += prefix + c + '=' + arrayP[e];
                        prefix = '&'
                    }
                    url += query;
                }
            }
        }
        if (params.method) {
            newP['method'] = params.method
        }
        return {params: newP, url: url}
    }

    public request(params = null, override_url = null, noDeepCopy = null, useProxy = null) {
        return new Promise((resolve, reject)=> {
            try {
                let utils = this.utils;
                let token = this.token;
                useProxy = this.utils.notBlankStr(useProxy) ? useProxy : (utils.notNull(constants['proxies']) && utils.notNull(constants['proxies']['enable']) ? constants['proxies']['enable'] : null);
                if (!utils.notBlankStr(noDeepCopy) || noDeepCopy == false) {
                    params = utils.deepCopy(params);
                }
                if (!utils.notNull(params))
                    params = {};
                //console.log(params.url);
                //console.log(utils.simple_array_filter(api.   , 'id', params.url).length);
                // if (!params.url || utils.simple_array_filter(api.interfaceMap, 'id', params.url).length <= 0)
                //   throw new Error(params.url + ": http request url invalid");

                //var request = utils.simple_array_filter(api.interfaceMap, 'id', params.url);
                var request
                try {
                    request = this.api[params.url];
                } catch (e) {

                }
                var url;
                if (utils.notNull(request)) {
                    //request = request[0];
                    if (!utils.notBlankStr(override_url))
                        url = request['url'][constants.background_interface_type];
                    else
                        url = override_url;
                }
                else if (utils.notBlankStr(override_url) || utils.notBlankStr(params.url)) {
                    request = null;
                    url = utils.notBlankStr(override_url) ? override_url : params.url;
                }
                else
                    throw new Error("http request params invalid");
                //var request = $filter("filter")(api.interfaceMap, {id: params.url})[0];

                // if (override_url)
                //   request.url[constants.background_interface_type] = override_url;
                //
                // var url = request.url[constants.background_interface_type];


                if (request) {
                    if (request['headers']) {
                        if (!params.headers)
                            params.headers = {};
                        params.headers = utils.mergeObject(params.headers, request['headers'])
                    }
                    if (request['params']) {
                        if (!params.params)
                            params.params = {};
                        params.params = utils.mergeObject(params.params, request['params'])
                    }
                    if (request['data']) {
                        if (!params.data)
                            params.data = {};
                        params.data = utils.mergeObject(params.data, request['data'])
                    }
                    if (request['restful']) {
                        if (!params.restful)
                            params.restful = {};
                        params.restful = utils.mergeObject(params.restful, request['restful'])
                    }
                    if (request['transformRequest']) {
                        if (!params.transformRequest)
                            params.transformRequest = request['transformRequest'];
                    }
                    if (utils.notBlankStr(request['method']) && !utils.notBlankStr(params.method)) {
                        params.method = request['method'];
                    }
                }

                if (!utils.notBlankStr(params.method)) {
                    if (!utils.notBlankStrAndObj(params.data))
                        params.method = 'GET'
                    else
                        params.method = 'POST'
                    //throw new Error(params.url + ": http request method invalid");
                }

                if ('local://' != url.substr(0, 8))
                    if (constants.proxies && constants.proxies.configs && ((!utils.notBlankStr(useProxy) && this.proxyCanEnable == false) || useProxy == false)) {
                        var proxy = this.getProxyConfig();
                        var paramurl = utils.getParamUrl(url, true);
                        url = utils.getLocationUrl(url);
                        for (var p in proxy) {
                            if (url.indexOf(proxy[p].path) >= 0) {
                                url = utils.replaceAll(url, proxy[p].path, proxy[p].proxyUrl);
                                url = url + paramurl;
                                break;
                            }
                        }
                    }

                if ('local://' === url.substr(0, 8)) {
                    url = url.substr(8);
                    params.method = "GET";
                    //delete params.params;
                } else if (params.data && params.data instanceof FormData) {
                    if (!params.headers) {
                        params.headers = {};
                        params.headers['Content-Type'] = undefined;
                    }
                    else {
                        var has = false;
                        for (var c in params.headers) {
                            if (c.toLowerCase() == 'content-type')
                                has = true;
                        }
                        if (has == false)
                            params.headers['Content-Type'] = undefined;
                    }

                    if (!params.transformRequest)
                        params.transformRequest = function (...arg) {
                            if (arg.length > 0)
                                return arg[0]
                        };
                }

                if (utils.notBlankStrAndObj(params.restful)) {
                    for (var c in params.restful) {
                        url = utils.replaceAll(url, ':' + c, params.restful[c]);
                    }
                    delete params.restful;
                }

                if (request && request['sendTokens'] && request['sendTokens'].length > 0) {
                    var method;
                    for (var c in request['sendTokens']) {
                        method = utils.notNull(request['sendTokens'][c].token_src) ? request['sendTokens'][c].token_src : constants.tokenStorageMethod;
                        var _token = token.get(request['sendTokens'][c].token_map, method);
                        var token_name = request['sendTokens'][c].token_name;
                        //alert(JSON.stringify(params));
                        if ((params.method === 'GET' && request['sendTokens'][c].token_transfer_mode === 'payload') || request['sendTokens'][c].token_transfer_mode === 'query') {
                            if (params.params)
                                params.params[token_name] = _token;
                            else
                                params["params"] = {token_name: _token};
                            /*if (url.indexOf('?') === -1)
                             url = url + '?' + token_name + '=' + _token;
                             else if (url.indexOf('?') === url.length - 1)
                             url = url + token_name + "=" + _token;
                             else
                             url = url + "&" + token_name + "=" + _token;*/
                        }
                        else if (request['sendTokens'][c].token_transfer_mode === 'payload') {
                            if (params.method == 'GET') {
                                //if (params.method === 'GET')
                                if (params.params)
                                    params.params[token_name] = _token;
                                else
                                    params["params"] = {token_name: _token};
                                // else {
                                //   if (params.headers)
                                //     params.headers[token_name] = _token;
                                //   else
                                //     params["headers"] = {token_name: _token};
                                // }
                                //throw new Error(params.url + ": http request method is " + params.method + " but token [" + request.tokens[c].token_map + "] transfer mod is " + request.tokens[c].token_transfer_mode + " which only support POST request");
                            }
                            else {
                                if (params.data)
                                    params.data[token_name] = _token;
                                else
                                    params["data"] = {token_name: _token};
                            }
                        }
                        else if (request['sendTokens'][c].token_transfer_mode === 'restful') {
                            url = utils.replaceAll(url, ':' + token_name, _token);
                        }
                        else {
                            //console.log()
                            if (params.headers)
                                params.headers[token_name] = _token;
                            else {
                                params["headers"] = {};
                                params.headers[token_name] = _token;
                            }
                        }
                    }
                }

                params.url = url;

                var waittime = utils.notNull(params.timeout) ? params.timeout : (request && utils.notNull(request['timeout']) ? request['timeout'] : (utils.notNull(constants.httpRequestTimeout) ? constants.httpRequestTimeout : 6000));
                //console.log(waittime)
                var waitid;
                if (waittime > 0)
                    waitid = setTimeout(function () {
                        reject({
                            data: null,
                            header: null,
                            status: -100,
                            statusText: 'timeout',
                            ok: null,
                            type: null,
                            url: params.url,
                            statusCode: -100
                        })
                        //console.log(32222222222222)
                    }, waittime);

                if (waittime >= 0) {
                    let requestParams = this.transformParams(params)
                    //requestParams.params['withCredentials'] = true
                    //alert(requestParams.url)

                    this.Http.request(requestParams.url, requestParams.params).subscribe((res)=> {
                        let data ;
                        try{
                        data= res.json();
                        }catch (err){
                          data=res.text();
                        }
                        let status = res.status, header = ()=> {
                            return this.transformHeaders(res.headers)
                        }, statusText = res.statusText;
                        if (waitid)
                            clearTimeout(waitid);
                        if (request && request['getTokens'] && request['getTokens'].length > 0) {
                            var paths, method, index, _data;
                            for (var e in request['getTokens']) {
                                if (request['getTokens'][e].token_receive_mode === 'header')
                                    _data = header();
                                else
                                    _data = data;
                                if (!_data)
                                    continue;
                                paths = request['getTokens'][e].token_receive_path==null?[]:request['getTokens'][e].token_receive_path.split('.');
                                for (var d in paths) {
                                    if (paths[d].substr(0, 1) === '[' && paths[d].substr(paths[d].length - 1) === ']')
                                        index = paths[d].substr(1, paths[d].length - 2);
                                    else
                                        index = paths[d];
                                    if (typeof _data == 'object' && utils.notNull(_data[index]))
                                        _data = _data[index];
                                    else {
                                        _data = null;
                                        break;
                                    }
                                }

                                if (utils.notNull(_data)) {
                                    method = utils.notNull(request['getTokens'][e].token_storage_method) ? request['getTokens'][e].token_storage_method : constants.tokenStorageMethod;
                                    token.set(request['getTokens'][e].token_map, _data, null, null, 0, method);
                                    // alert(request['getTokens'][e].token_map)
                                }
                            }
                        }

                        var remove_config;
                        if (request && request['removeTokens'] && utils.simple_array_filter(request['removeTokens'], 'response_type', 'success').length > 0) {
                            remove_config = utils.simple_array_filter(request['removeTokens'], 'response_type', 'success');
                            //remove_config = $filter("filter")(request['removeTokens'], {response_type: 'success'});
                            for (var p in remove_config) {
                                if (remove_config[p].condition_path == null || remove_config[p].condition_path == '')
                                    continue;
                                var paths, method, index, _data;
                                if (remove_config[p].condition_mode === 'header')
                                    _data = header();
                                else
                                    _data = data;
                                if (!_data)
                                    continue;
                                paths = remove_config[p].condition_path.split('.');
                                for (var d in paths) {
                                    if (paths[d].substr(0, 1) === '[' && paths[d].substr(paths[d].length - 1) === ']')
                                        index = paths[d].substr(1, paths[d].length - 2);
                                    else
                                        index = paths[d];
                                    if (typeof _data == 'object' && utils.notNull(_data[index]))
                                        _data = _data[index];
                                    else {
                                        _data = null;
                                        break;
                                    }
                                }

                                method = utils.notNull(remove_config[p].token_remove_method) ? remove_config[p].token_remove_method : constants.tokenStorageMethod;
                                if (_data != null)
                                    if (remove_config[p].condition_value == null) {
                                        if (remove_config[p].token_map)
                                            token.delete(remove_config[p].token_map);
                                        //alert(remove_config[p].token_map)
                                        // if (remove_config[p].redirect_to)
                                        //     this.router.push(remove_config[p].redirect_to, utils.injectRedirectedParams(remove_config[p].redirect_params), remove_config[p].redirect_params_options, remove_config[p].redirect_done)
                                        // setTimeout(function () {
                                        //   if (remove_config[p].redirect_to) {
                                        //     state.go(remove_config[p].redirect_to, remove_config[p].redirect_params, remove_config[p].redirect_params_options, remove_config[p].redirect_mode);
                                        //   }
                                        // })
                                    }
                                    else if (remove_config[p].condition_value == _data) {
                                        if (remove_config[p].token_map)
                                            token.delete(remove_config[p].token_map);
                                        // if (remove_config[p].redirect_to)
                                        //     this.router.push(remove_config[p].redirect_to, utils.injectRedirectedParams(remove_config[p].redirect_params), remove_config[p].redirect_params_options, remove_config[p].redirect_done)
                                        //alert(remove_config[p].token_map)
                                        //alert(remove_config[p].token_map)
                                        // setTimeout(function () {
                                        //   if (remove_config[p].redirect_to) {
                                        //     state.go(remove_config[p].redirect_to, remove_config[p].redirect_params, remove_config[p].redirect_params_options, remove_config[p].redirect_mode);
                                        //   }
                                        // })
                                    }
                            }
                        }

                        resolve({
                            data: data,
                            header: header,
                            status: status,
                            statusText: statusText,
                            ok: res.ok,
                            type: res.type,
                            url: res.url,
                            statusCode: 0
                        })
                    }, (res)=> {
                        //alert(JSON.stringify(res))
                        //alert(JSON.stringify(res.text()))
                      let data ;
                      try{
                        data= res.json();
                      }catch (err){
                        data=res.text();
                      }
                      let status = res.status, header = ()=> {
                            return this.transformHeaders(res.headers)
                        }, statusText = res.statusText;
                        //data = (data instanceof String) ? {data: data} : data;
                        if (waitid)
                            clearTimeout(waitid);
                        var remove_config;
                        if (request && request['removeTokens'] && utils.simple_array_filter(request['removeTokens'], 'response_type', 'error').length > 0) {
                            remove_config = utils.simple_array_filter(request['removeTokens'], 'response_type', 'error');
                            //remove_config = $filter("filter")(request['removeTokens'], {response_type: 'error'});
                            for (var p in remove_config) {
                                var paths, method, index, _data;
                                if (remove_config[p].condition_path == null || remove_config[p].condition_path == '')
                                    _data = remove_config[p].condition_mode === 'header' ? header() : data;
                                else {
                                    if (remove_config[p].condition_mode === 'header')
                                        _data = header();
                                    else
                                        _data = data;
                                    if (!_data)
                                        continue;
                                    paths = remove_config[p].condition_path.split('.');
                                    for (var d in paths) {
                                        if (paths[d].substr(0, 1) === '[' && paths[d].substr(paths[d].length - 1) === ']')
                                            index = paths[d].substr(1, paths[d].length - 2);
                                        else
                                            index = paths[d];
                                        if (typeof _data == 'object' && utils.notNull(_data[index]))
                                            _data = _data[index];
                                        else {
                                            _data = null;
                                            break;
                                        }
                                    }
                                }

                                method = utils.notNull(remove_config[p].token_remove_method) ? remove_config[p].token_remove_method : constants.tokenStorageMethod;
                                if (_data != null)
                                    if (remove_config[p].condition_value == null) {
                                        if (remove_config[p].token_map)
                                            token.delete(remove_config[p].token_map);
                                        // if (remove_config[p].redirect_to)
                                        //     this.router.push(remove_config[p].redirect_to, utils.injectRedirectedParams(remove_config[p].redirect_params), remove_config[p].redirect_params_options, remove_config[p].redirect_done)
                                        // setTimeout(function () {
                                        //   if (remove_config[p].redirect_to)
                                        //     state.go(remove_config[p].redirect_to, utils.injectRedirectedParams(remove_config[p].redirect_params), remove_config[p].redirect_params_options, remove_config[p].redirect_mode);
                                        // })
                                    }
                                    else if (remove_config[p].condition_value == _data) {
                                        if (remove_config[p].token_map)
                                            token.delete(remove_config[p].token_map);
                                        // if (remove_config[p].redirect_to)
                                        //     this.router.push(remove_config[p].redirect_to, utils.injectRedirectedParams(remove_config[p].redirect_params), remove_config[p].redirect_params_options, remove_config[p].redirect_done)
                                        // setTimeout(function () {
                                        //   if (remove_config[p].redirect_to)
                                        //     state.go(remove_config[p].redirect_to, utils.injectRedirectedParams(remove_config[p].redirect_params), remove_config[p].redirect_params_options, remove_config[p].redirect_mode);
                                        // })
                                    }
                            }
                        }

                        reject({
                            data: data,
                            header: header,
                            status: status,
                            statusText: statusText,
                            ok: res.ok,
                            type: res.type,
                            url: res.url,
                            statusCode: -1
                        })
                    })
                }
            } catch (e) {
                reject({statusCode: -200, error: e})
            }
        })

        /*$emiya.http.request({
         method: "POST",
         url: 'login',
         data: {
         "username": 123,
         "password": 123
         },
         headers: {"apikey": "3e2f3c76-f16e-470e-8c67-ba09a920c3a9"},
         params: {fate: 1, fate3: 3}
         }).success(function (data, header, config, status, statusText) {
         }).error(function (data, header, config, status, statusText) {
         });*/
    }
    ;

    public src(url = null, params = null, override_url = null, noDeepCopy = null, useProxy = null) {
        let utils = this.utils;
        let token = this.token;
        useProxy = utils.notBlankStr(useProxy) ? useProxy : (utils.notNull(constants['proxies']) && utils.notNull(constants['proxies']['enable']) ? constants['proxies']['enable'] : null);
        if (!utils.notBlankStr(noDeepCopy) || noDeepCopy == false) {
            params = utils.deepCopy(params);
        }
        if (!utils.notNull(params))
            params = {};
        //var request_config = utils.simple_array_filter(api.interfaceMap, 'id', url);
        var request_config = this.api[url];
        //var request_config = $filter("filter")(api.interfaceMap, {id: url});
        if (!utils.notNull(request_config) && !override_url)
            return '';
        else if (utils.notNull(request_config)) {
            //request_config = request_config[0];
        }
        else
            request_config = null;

        var method;
        var query = '';

        if (request_config && request_config['sendTokens'] && request_config['sendTokens'].length > 0) {
            for (var c in request_config['sendTokens']) {
                method = utils.notNull(request_config['sendTokens'][c].token_src) ? request_config['sendTokens'][c].token_src : constants.tokenStorageMethod;
                query = query + "&" + request_config['sendTokens'][c].token_name + '=' + token.get(request_config['sendTokens'][c].token_map, method);
            }
        }

        if (request_config) {
            if (request_config['params']) {
                if (!params.params)
                    params.params = {};
                params.params = utils.mergeObject(params.params, request_config['params'])
            }
            if (request_config['restful']) {
                if (!params.restful)
                    params.restful = {};
                params.restful = utils.mergeObject(params.restful, request_config['restful'])
            }
        }

        for (var key in params.params) {
            if (params.params[key] instanceof Array) {
                for (let j in params.params[key]) {
                    query = query + "&" + key + "=" + params.params[key][j];
                }
            } else
                query = query + "&" + key + "=" + params.params[key];
        }

        /*if (config.interfaceMap[url].getTokens && config.interfaceMap[url].getTokens.length > 0) {
         query = query + "&" + "getTokens=" + url;
         }*/

        var _url = override_url ? override_url : request_config['url'][constants.background_interface_type];

        if ('local://' === _url.substr(0, 8)) {
            _url = _url.substr(8);
            query = '';
        }
        else if (constants.proxies && constants.proxies.configs && ((!utils.notBlankStr(useProxy) && this.proxyCanEnable == false) || useProxy == false)) {
            var proxy = this.getProxyConfig();
            var paramurl = utils.getParamUrl(_url, true);
            _url = utils.getLocationUrl(_url);
            for (var p in proxy) {
                if (_url.indexOf(proxy[p].path) >= 0) {
                    _url = utils.replaceAll(_url, proxy[p].path, proxy[p].proxyUrl);
                    _url = _url + paramurl;
                    break;
                }
            }
            if ('local://' === _url.substr(0, 8)) {
                _url = _url.substr(8);
                query = '';
            }
        }

        if (utils.notBlankStrAndObj(params.restful)) {
            for (var c in params.restful) {
                _url = utils.replaceAll(_url, ':' + c, params.restful[c]);
            }
        }

        if (query !== '') {
            if (_url.indexOf("?") >= 0 && _url.indexOf("?") < _url.length - 1)
                query = '&' + query.substr(1);
            else if (_url.indexOf("?") >= 0 && _url.indexOf("?") == _url.length - 1)
                query = query.substr(1);
            else
                query = '?' + query.substr(1);
        }

        return _url + query;
    }

    public srcWithoutToken(url = null, params = null, override_url = null, noDeepCopy = null, useProxy = null) {
        let utils = this.utils;
        //let token = this.token;
        useProxy = utils.notBlankStr(useProxy) ? useProxy : (utils.notNull(constants['proxies']) && utils.notNull(constants['proxies']['enable']) ? constants['proxies']['enable'] : null);
        if (!utils.notBlankStr(noDeepCopy) || noDeepCopy == false) {
            params = utils.deepCopy(params);
        }
        if (!utils.notNull(params))
            params = {};
        //var request_config = utils.simple_array_filter(api.interfaceMap, 'id', url);
        var request_config = this.api[url];
        //var request_config = $filter("filter")(api.interfaceMap, {id: url});
        if (!utils.notNull(request_config) && !override_url)
            return '';
        else if (utils.notNull(request_config)) {
            //request_config = request_config[0];
        }
        else
            request_config = null;

        var method;
        var query = '';

        /*if (request_config && request_config.sendTokens && request_config.sendTokens.length > 0) {
         for (var c in request_config.sendTokens) {
         method = utils.notnull(request_config.sendTokens[c].token_src) ? request_config.sendTokens[c].token_src : constants.tokenStorageMethod;
         query = query + "&" + request_config.sendTokens[c].token_name + '=' + token.getToken(request_config.sendTokens[c].token_map, method);
         }
         }*/

        if (request_config) {
            if (request_config['params']) {
                if (!params.params)
                    params.params = {};
                params.params = utils.mergeObject(params.params, request_config['params'])
            }
            if (request_config['restful']) {
                if (!params.restful)
                    params.restful = {};
                params.restful = utils.mergeObject(params.restful, request_config['restful'])
            }
        }

        for (var key in params.params) {
            if (params.params[key] instanceof Array) {
                for (let j in params.params[key]) {
                    query = query + "&" + key + "=" + params.params[key][j];
                }
            } else
                query = query + "&" + key + "=" + params.params[key];
        }

        /*if (config.interfaceMap[url].getTokens && config.interfaceMap[url].getTokens.length > 0) {
         query = query + "&" + "getTokens=" + url;
         }*/

        var _url = override_url ? override_url : request_config['url'][constants.background_interface_type];

        if ('local://' === _url.substr(0, 8)) {
            _url = _url.substr(8);
            query = '';
        } else if (/*platform != 'server' && */constants.proxies && constants.proxies.configs && ((!utils.notBlankStr(useProxy) && this.proxyCanEnable == false) || useProxy == false)) {
            var proxy = this.getProxyConfig();
            var paramurl = utils.getParamUrl(_url, true);
            _url = utils.getLocationUrl(_url);
            for (var p in proxy) {
                if (_url.indexOf(proxy[p].path) >= 0) {
                    _url = utils.replaceAll(_url, proxy[p].path, proxy[p].proxyUrl);
                    _url = _url + paramurl;
                    break;
                }
            }
            if ('local://' === _url.substr(0, 8)) {
                _url = _url.substr(8);
                query = '';
            }
        }

        if (utils.notBlankStrAndObj(params.restful)) {
            for (var c in params.restful) {
                _url = utils.replaceAll(_url, ':' + c, params.restful[c]);
            }
        }

        if (query !== '') {
            if (_url.indexOf("?") >= 0 && _url.indexOf("?") < _url.length - 1)
                query = '&' + query.substr(1);
            else if (_url.indexOf("?") >= 0 && _url.indexOf("?") == _url.length - 1)
                query = query.substr(1);
            else
                query = '?' + query.substr(1);
        }
        return _url + query;
    };

    public transformRequest(obj) {
        var str = [];
        for (var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        //console.log(str)
        return str.join("&");
    }


    public translateObj2UrlParam(obj, prefix = null) {
        let stack = []
        this._translateObj(obj, prefix, stack)
        let result = {}
        for (let c in stack)
            result[stack[c]['key']] = stack[c]['value']
        return result
    }

    private _translateObj(obj, prefix, stack) {
        for (let c in obj)
            if (typeof obj[c] == 'object')
                this._translateObj(obj[c], (prefix == null || prefix == '') ? (c) : (prefix + '[' + c + ']'), stack)
            else
                stack.push({key: (prefix == null || prefix == '') ? (c) : (prefix + '[' + c + ']'), value: obj[c]})
    }

}
