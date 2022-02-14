> Dice Game Server
React Native Toy Project 에 대응하는 서버

> Environment
```
node server : express , socketio
db : simple json db
```
https://expressjs.com/ko/
https://poiemaweb.com/nodejs-socketio


> Structure
```
constant : 상수정의
utils : 유틸

server - routes : for Http REQ/RES API
       - subContorller : for socket IO

service : 로직

dataAccess : db CRUD
```

> IO 명세


> JSON 명세
```
{
    "playerList": [
        {
            "playerId": "홍길동",
            "socketId": "WB-YWlZ60Rbq5sTFAAAR",
            "roomId": "예제방이름"
        }
    ],
    "roomList": [
        {
            "roomId": "예제방이름",
            "playerList": [
                {
                    "playerId": "홍길동",
                    "socketId": "WB-YWlZ60Rbq5sTFAAAR",
                    "roomId": "예제방이름",
                    "team": "I"
                },
                {
                    "playerId": "B",
                    "socketId": "AUTO",
                    "roomId": "예제방이름",
                    "team": "I"
                },
                {
                    "playerId": "C",
                    "socketId": "AUTO",
                    "roomId": "예제방이름",
                    "team": "II"
                },
                {
                    "playerId": "D",
                    "socketId": "AUTO",
                    "roomId": "예제방이름",
                    "team": "II"
                }
            ],
            "timeStamp": 1644798439746,
            "turn": "홍길동",
            "score": {
                "I": [
                    2
                ],
                "II": [
                    2,
                    3,
                    4
                ]
            },
            "host": "홍길동",
            "round": 4,
            "diceResult": 2,
            "teams": {
                "I": [
                    {
                        "playerId": "홍길동",
                        "socketId": "WB-YWlZ60Rbq5sTFAAAR",
                        "roomId": "예제방이름",
                        "team": "I"
                    },
                    {
                        "playerId": "B",
                        "socketId": "AUTO",
                        "roomId": "예제방이름",
                        "team": "I"
                    }
                ],
                "II": [
                    {
                        "playerId": "C",
                        "socketId": "AUTO",
                        "roomId": "예제방이름",
                        "team": "II"
                    },
                    {
                        "playerId": "D",
                        "socketId": "AUTO",
                        "roomId": "예제방이름",
                        "team": "II"
                    }
                ]
            }
        }
    ]
}
```

