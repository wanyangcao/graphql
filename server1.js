// 自定义类型
// query:

// mutation {
//     addDate(input:{
//       pubDate:"2017-12-20T07:21:25.000Z"
//     }) {
//       pubDate
//     }
// }

var express = require('express');
var graphqlHTTP = require('express-graphql');
var { buildSchema,  GraphQLScalarType, Kind, GraphQLError} = require('graphql');
// 创建schema
var schema = buildSchema(
    `
        scalar Date
        type User {
            id: ID!
            name: String
            age: Int
            photo: String
            addr: Addr
            friends(size: Int): [User]
        }

        type Addr {
            country: String
            area: String
        }
    
        input InputDate {
            pubDate: Date
        }

        type MyDate {
            pubDate: Date
        }

        type Query {
            getUser(id: ID!): User
            getDate: Date
        }

        type Mutation {
            addDate(input: InputDate): MyDate
        }
    `
);

// mock
var mockDb = {
    10001: {
        id: 10001,
        name: 'caowanyang',
        age: 18,
        photo: 'abc',
        addr: {
            country: '中国',
            area: '河南'
        },
        friends: [
            {
                10002: {
                    id: 10002,
                    name: 'lee',
                    age: 18,
                    photo: 'aaa',
                    addr: {
                        country: 'AA',
                        area: 'BB'
                    }
                }
            },
            {
                10003: {
                    id: 10003,
                    name: 'ly',
                    age: 18,
                    photo: 'ccc',
                    addr: {
                        country: 'ccc',
                        area: '51'
                    }
                }
            }
        ]
    }
}

class User {
    constructor(id, {name, age, photo, addr, friends}) {
        this.id = id
        this.name = name
        this.age = age
        this.photo = photo
        this.addr = addr
        this.friends = ({size})=> {
            var user = []
            friends.forEach(element => {
                for (var key in element) {
                    element[key].id = key
                    user.push(element[key])
                }
            });
            console.log(user)
            if (size != undefined && size < user.length) {
                return user.slice(0, size)
            }else {
                return user
            }
        }
    }
}

class MyDate {
    constructor({pubDate}) {
        this.pubDate = pubDate
    }
}

Object.assign(schema._typeMap.Date, {
    // 创建一个date类型，在服务端都存储为整形，
    // 返回客户端时显示为date
    name: 'Date',
    description: "自定义日期类型",
    // value 从客户端传入的
    parseValue: (value)=> {
        console.log("parseValue", value)
        return value;
    },
    // 返回客户端的值
    serialize: (value)=> {
        console.log("serialize", value)
        return new Date(value * 1000);
    },
    // 校验客户端传来的数据
    parseLiteral: (ast)=> {
        console.log("parseLiteral", ast)
        if (ast.kind != Kind.STRING) {
            console.log('type error', ast.kind);
            throw new GraphQLError('类应该为string,实际是：', ast.kind, [ast])
        }
        return parseInt(ast.value, 10);
    }
})

// root 入口
var root = {
    getDate: ()=> {
        var dd = new Date()
        return 1513754485
    },
    getUser: ({id})=> {
        if (!mockDb[id]) {
            throw new Error('id不存在' + id)
        }
        return new User(id, mockDb[id])
    },
    addDate: ({input})=> {
        console.log("addDate", input);
        return new MyDate(input);
    }

};

var app = express();
app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));
// app.use(express.static('static'))
app.listen(4000);
console.log("Running a graphQL API server");