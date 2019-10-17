const querystring = require('querystring')
// const { get, set } = require('./src/db/redis')
// const { access } = require('./src/utils/log')
const handleBlogRouter = require('./src/router/blog')
const handleUserRouter = require('./src/router/user')

// 获取 cookie 的过期时间
const getCookieExpires = () => {
    const d = new Date()
    d.setTime(d.getTime() + (24 * 60 * 60 * 1000))
    console.log('d.toGMTString() is ', d.toGMTString())
    return d.toGMTString()
}

// // session 数据
const SESSION_DATA = {}

// 用于处理 post data
const getPostData = (req) => {
    const promise = new Promise((resolve, reject) => {
        if (req.method !== 'POST') {
            resolve({})
            return
        }
        if (req.headers['content-type'] !== 'application/json') {
            resolve({})
            return
        }
        let postData = ''
        req.on('data', chunk => {
            postData += chunk.toString()
        })
        req.on('end', () => {
            if (!postData) {
                resolve({})
                return
            }
            resolve(
                JSON.parse(postData)
            )
        })
    })
    return promise
}

const serverHandle = (req, res) => {
    // 记录 access log
    // access(`${req.method} -- ${req.url} -- ${req.headers['user-agent']} -- ${Date.now()}`)

    // 设置返回格式 JSON
    res.setHeader('Content-type', 'application/json')

    // 获取 path
    const url = req.url
    req.path = url.split('?')[0]

    // 解析 query
    req.query = querystring.parse(url.split('?')[1])

    //解析 cookie
    req.cookie={}
    const cookieStr = req.headers.cookie || ''
    cookieStr.split(';').forEach(element => {
        if (!element){
            return
        }
        const arr=element.split('=');
        const key = arr[0].trim();
        const val = arr[1].trim();
        req.cookie[key] = val
    });
    // console.log('cookie is ' + JSON.stringify(req.cookie))

    // 解析session
    let needSetCookie=false;
    let userId = req.cookie.userId
    if(userId){
        if (!SESSION_DATA[userId]){
            SESSION_DATA[userId]={}
        }
        req.session = SESSION_DATA[userId]
    }
    else{
        needSetCookie=true
        userId=`${Date.now()}_${Math.random()}`
        SESSION_DATA[userId] = {}
    }
    req.session = SESSION_DATA[userId]

    getPostData(req).then(data => {
        req.body=data;
        const blogResult = handleBlogRouter(req, res)
        if (blogResult) {
            blogResult.then(blogData => {
                if (needSetCookie){
                    res.setHeader('Set-cookie', `userId=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`)

                }
                res.end(
                    JSON.stringify(blogData)
                )
            })
            return;
        }

        const userResult = handleUserRouter(req, res)
        if (userResult) {
            userResult.then(userData => {
                if (needSetCookie) {
                    res.setHeader('Set-cookie', `userId=${userId}; path=/; httpOnly; expires=${getCookieExpires()}`)

                }
                res.end(
                    JSON.stringify(userData)
                )
            })
            return;
        }

        res.writeHead(404, {
            "Content-type": "text/plain"
        })
        res.write("404 Not Found\n")
        res.end()
    })
}

module.exports = serverHandle

// process.env.NODE_ENV
