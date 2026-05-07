/*
 * 커뮤니티 화면
 * 연령별 카테고리(라디오버튼)를 통해 연령별 커뮤니티 분류
 * 커뮤니티 글 목록 표시
 * 오른쪽 하단에는 동그랗게 + 버튼(플로팅 액션 버튼)으로 글 작성 화면으로 이동
 * 내가 작성한 글은 수정 및 삭제 가능
 * 카카오 메신저처럼 내가 작성한 글은 화면 오른쪽/ 타인이 작성한 글은 왼쪽에 배치
 * 글 작성자는 프로필 이미지와 닉네임 표시
 * 글 작성 시간 표시
 * 공감 버튼 및 공감 수 표시
 * 댓글등록/수정 모달 및 댓글 수 표시
 */

 /**
 백앤드 예시
 {
    "success": true,
    "message": null,
    "error": null,
    "data": {
        "communities": [
            {
                "is_ad": false,
                "id": 38,
                "view_hash": "a1bc4d2f8ad171a722012d0c07faac371525c8a681f7408d9fcf398a2dfc113d",
                "category_code": 23,
                "user_id": 56,
                "title": "우어엉",
                "contents": "우어엉",
                "user_nickname": "임영 민2",
                "like_count": 0,
                "view_count": 2,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-14 16:46:26",
                "updated_at": "2026-04-15 09:25:25",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/38/38/20260414164626_cea9fe4e"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 37,
                "view_hash": "34fc2327dd9a8418a522a9d55355c8a05e7544a7c717a0bc60bd6c1f459c4838",
                "category_code": 26,
                "user_id": 9,
                "title": "테스트",
                "contents": "테스트2",
                "user_nickname": "테스트5",
                "like_count": 0,
                "view_count": 13,
                "comment_count": 6,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-14 15:28:38",
                "updated_at": "2026-04-15 09:26:21",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "테스트5",
                    "profile_image": "/attaches/users/9/20251208161803_f66029e5.jpeg",
                    "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
                },
                "child": {
                    "child_name": "흥옹잉",
                    "child_birth": "2026-02-02",
                    "child_gender": "W"
                }
            },
            {
                "is_ad": false,
                "id": 36,
                "view_hash": "9efa80a6320f643fdbc86d2b51d12e6ca0ef3035056edb2da663afa9c8b72fda",
                "category_code": 26,
                "user_id": 9,
                "title": "Susy",
                "contents": "Retc",
                "user_nickname": "테스트5",
                "like_count": 0,
                "view_count": 6,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-13 14:27:04",
                "updated_at": "2026-04-14 15:29:27",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "테스트5",
                    "profile_image": "/attaches/users/9/20251208161803_f66029e5.jpeg",
                    "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
                },
                "child": {
                    "child_name": "흥옹잉",
                    "child_birth": "2026-02-02",
                    "child_gender": "W"
                }
            },
            {
                "is_ad": false,
                "id": 35,
                "view_hash": "ace56d5bcf432ca76a5272a285357b722ae2f08e48c02392bb2264ca5287be72",
                "category_code": 26,
                "user_id": 56,
                "title": "111",
                "contents": "221",
                "user_nickname": "임영 민2",
                "like_count": 0,
                "view_count": 16,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-07 09:35:04",
                "updated_at": "2026-04-07 10:33:09",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/35/35/20260407094710_138eeec7",
                    "/attaches/Communities/35/35/20260407094711_16b3c1cf"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 31,
                "view_hash": "2b6e86129d78f7db3816cbba2b35803afa6ff56d47e1ffd8733983b61c08c70a",
                "category_code": 26,
                "user_id": 56,
                "title": "11",
                "contents": "22",
                "user_nickname": "임영 민2",
                "like_count": 0,
                "view_count": 0,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-07 09:29:03",
                "updated_at": "2026-04-07 09:29:03",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 30,
                "view_hash": "06d6906cc52f470383af3b1f9ef1d052e7625314259efc10d3224ba49dfc2fd7",
                "category_code": 24,
                "user_id": 56,
                "title": "쌀국수",
                "contents": "쌀쌀쌀",
                "user_nickname": "임영 민2",
                "like_count": 0,
                "view_count": 11,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-07 09:20:24",
                "updated_at": "2026-04-07 09:47:55",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 29,
                "view_hash": "9dae06752b6152321e8ef4aac77640045cb15981d859e11abbe0d2c4bcd8e7b2",
                "category_code": 26,
                "user_id": 79,
                "title": "끄바",
                "contents": "쓰바",
                "user_nickname": "식묵",
                "like_count": 0,
                "view_count": 12,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-06 20:49:14",
                "updated_at": "2026-04-07 10:21:47",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "식묵",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocIM639yfAwmCg8e1oGvSd60sJcVpTTLovR27lkK3shooM1VUlE=s96-c",
                    "user_hash": "b9c2e3d369c600947d0a97c9a34715d117b3b5904e0654e79f5baf6bc591483b"
                },
                "child": {
                    "child_name": "애지묵",
                    "child_birth": "2025-11-04",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": true,
                "id": 5,
                "contents": "aaaa",
                "images": [
                    "/attaches/Ads/04/4/20260504143110_ab9ffd54",
                    "/attaches/Ads/05/5/20260504165321_71d16df1"
                ],
                "view_hash": "d8cdbe1f1dda9d1d36c0ea8203b677a47b207dd84a106f737bd17442b0f5e9ae",
                "target_link": "https://naver.com",
                "user": {
                    "profile_image": "/attaches/Advertiser/01/1/20260504161303_02d5df72",
                    "nickname": "회사명2222",
                    "user_hash": "3beb3b82d505e62203f49d00d7001b340ee3d47c17cd0ce0beeece06c143e813"
                }
            },
            {
                "is_ad": false,
                "id": 28,
                "view_hash": "34ce0430a700b8aa9fa18077495df972df85c742d7b933a1985f947ae06c37b0",
                "category_code": 26,
                "user_id": 56,
                "title": "글",
                "contents": "글글",
                "user_nickname": "임영 민2",
                "like_count": 0,
                "view_count": 0,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-04-01 10:30:57",
                "updated_at": "2026-04-01 10:30:57",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 27,
                "view_hash": "4aa4110f190ab6a2b020b05847494ef4c9cb782dc5ee2b830db24f29da77b754",
                "category_code": 26,
                "user_id": 56,
                "title": "아무말",
                "contents": "대잔치",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 9,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-03-12 15:53:07",
                "updated_at": "2026-04-07 10:34:57",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/27/27/20260312155307_b8619952",
                    "/attaches/Communities/27/27/20260312155314_149ad941",
                    "/attaches/Communities/27/27/20260312155318_aaa64200"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 26,
                "view_hash": "3e8bf30eebcf17e5b73352d32fafe89435eb168b25e9af340153b81f0a0104ce",
                "category_code": 26,
                "user_id": 56,
                "title": "아무말",
                "contents": "대잔치",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 1,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-03-12 15:51:01",
                "updated_at": "2026-04-07 10:35:07",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/26/26/20260312155101_90ed0dbe",
                    "/attaches/Communities/26/26/20260312155110_6569f5b7",
                    "/attaches/Communities/26/26/20260312155117_7f55fe70"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 25,
                "view_hash": "5cd07b73053a230c1bfb905804761f7ac0d0cfb8e149cecfe6b3985f5d4ee59a",
                "category_code": 26,
                "user_id": 56,
                "title": "아무말",
                "contents": "대잔치",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 0,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-03-12 15:48:40",
                "updated_at": "2026-03-12 15:48:40",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/25/25/20260312154840_b127927c"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 24,
                "view_hash": "a1734b8f44a05a13b16d495b11980f6d7af07dc47aa909580a96cf19d262aeee",
                "category_code": 26,
                "user_id": 56,
                "title": "아무말",
                "contents": "대잔치",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 0,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-03-12 15:47:53",
                "updated_at": "2026-03-12 15:47:53",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/24/24/20260312154753_4ae24a36"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 23,
                "view_hash": "12c0e972111d93fd6c9211cabf9bbf9866ebfdd1e2606004394b3f6c698b6e18",
                "category_code": 26,
                "user_id": 56,
                "title": "아무말",
                "contents": "대잔치",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 0,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-03-12 15:46:52",
                "updated_at": "2026-03-12 15:46:52",
                "pinned_at": null,
                "images": [
                    "/attaches/Communities/23/23/20260312154652_9d4b06f6"
                ],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 22,
                "view_hash": "c7258c5f8b8481c7536f57d48e0920c00584569ec4a91cef916db2053964565b",
                "category_code": 26,
                "user_id": 56,
                "title": "달이떠오른더",
                "contents": "가자",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 1,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-03-12 14:38:24",
                "updated_at": "2026-03-12 14:38:32",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": true,
                "id": 4,
                "contents": "룰라룰라\n룰루랄라",
                "images": [
                    "/attaches/Ads/04/4/20260504143109_ecbd8524",
                    "/attaches/Ads/04/4/20260504143109_a8ceca19"
                ],
                "view_hash": "7ad08ee8600f8ea8fa1a30b6151752a3749175428b7a16c8eb1dffbf925f0c69",
                "target_link": "https://naver.com",
                "user": {
                    "profile_image": "/attaches/Advertiser/02/2/20260504104812_358d4bb4",
                    "nickname": "회사명",
                    "user_hash": "25ce57a1e77a1b6b59c7947730c313c8d62cc9c29b6a0ee4d48f5a235fee5d43"
                }
            },
            {
                "is_ad": false,
                "id": 21,
                "view_hash": "b20bd7ee4c72fd3e5b7b0c8a5bd2d3ee2574b6235fe9874b701fcfd95bc7173f",
                "category_code": 24,
                "user_id": 9,
                "title": "363ㅇ",
                "contents": "363",
                "user_nickname": "테스트5",
                "like_count": 0,
                "view_count": 27,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-02-19 12:27:05",
                "updated_at": "2026-02-19 16:59:33",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "테스트5",
                    "profile_image": "/attaches/users/9/20251208161803_f66029e5.jpeg",
                    "user_hash": "546f41bd860c2319bb800369fc055d8b0c21d0143f94c1029d0052afd85b35c1"
                },
                "child": {
                    "child_name": "흥옹잉",
                    "child_birth": "2026-02-02",
                    "child_gender": "W"
                }
            },
            {
                "is_ad": false,
                "id": 20,
                "view_hash": "ddc067c262a0437860ffca690a17ad2745bddff7ae5f7f26ef29e6238c300bc4",
                "category_code": 23,
                "user_id": 56,
                "title": "궁금",
                "contents": "해요ㅋㅋㅋㅋㅋ\nㅋ\nㅋㅋ\n\nㅋ\nㅋㅋㅋㅋㅋㅋㅋㅋz\nzzz",
                "user_nickname": "임영 민",
                "like_count": 0,
                "view_count": 53,
                "comment_count": 1,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-02-19 10:43:51",
                "updated_at": "2026-03-17 08:26:35",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "임영 민2",
                    "profile_image": "https://lh3.googleusercontent.com/a/ACg8ocJjNJhAmGL_BGJhWMFZGAFJt-Fy7ilIO6xRUAT-cb37lZGjgA=s96-c",
                    "user_hash": "c99ebe8d4a50387312b8e19c077c3936ac6175ff282088a66ee9db3bb3d8d632"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2026-03-17",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 19,
                "view_hash": "e464e87546dc1fba62d9041b13084145d31970699b8e18840f26b55862a7f6f1",
                "category_code": 23,
                "user_id": 68,
                "title": "다다",
                "contents": "아아아아\n아아아\n아아아",
                "user_nickname": "테스트22",
                "like_count": 0,
                "view_count": 9,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-02-12 17:00:04",
                "updated_at": "2026-02-24 15:04:24",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "테스트22",
                    "profile_image": "/attaches/users/temp/20260209115853_eed5b724",
                    "user_hash": "85a4ec283a10181cd0bf3d71cd69415b817f10ff55a0d5b57ea94fe5bffc1af1"
                },
                "child": {
                    "child_name": "은서1",
                    "child_birth": "2026-02-09",
                    "child_gender": "W"
                }
            },
            {
                "is_ad": false,
                "id": 18,
                "view_hash": "bd07b4180ce50bab0261c3664640f9e7152443ebc288e034802de72b647056fc",
                "category_code": 26,
                "user_id": 42,
                "title": "인사드립니다",
                "contents": "허허",
                "user_nickname": "백골낭만",
                "like_count": 0,
                "view_count": 114,
                "comment_count": 16,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-01-23 20:09:31",
                "updated_at": "2026-02-19 09:41:16",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "백골낭만",
                    "profile_image": "/attaches/users/42/20260123110552_e6f68878",
                    "user_hash": "54cf8b2fe89eda157e0ab976e8572152b72594eb2a7e34994b976a64e3cc1d13"
                },
                "child": {
                    "child_name": "이웃집로또로",
                    "child_birth": "1992-08-20",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 17,
                "view_hash": "2147ea160c1682e977e05cb43298559073e7ad59a57ab244e01cca14ac35d8d0",
                "category_code": 26,
                "user_id": 41,
                "title": "안녕하세요",
                "contents": "허허허",
                "user_nickname": "꼴남이",
                "like_count": 0,
                "view_count": 0,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-01-23 19:58:58",
                "updated_at": "2026-01-23 19:58:58",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "꼴남이",
                    "profile_image": "/attaches/users/41/20260123105558_919be789",
                    "user_hash": "18a9ead6ebbd76f3f6f63e039277f7b43e928687d9aec5d5a5e294c28af896ef"
                },
                "child": {
                    "child_name": "임영민",
                    "child_birth": "1992-08-20",
                    "child_gender": "M"
                }
            },
            {
                "is_ad": false,
                "id": 16,
                "view_hash": "7da088e3ba6c7b4d181d153becd57a239ca530944c2cc9852c8e1c76ee949c31",
                "category_code": 25,
                "user_id": 40,
                "title": "이미지바꾸",
                "contents": "아아아",
                "user_nickname": "dev",
                "like_count": 0,
                "view_count": 3,
                "comment_count": 0,
                "is_secret": "N",
                "is_active": "Y",
                "is_notice": "N",
                "is_liked": "N",
                "created_at": "2026-01-23 17:11:39",
                "updated_at": "2026-02-24 17:13:36",
                "pinned_at": null,
                "images": [],
                "user": {
                    "nickname": "dev",
                    "profile_image": "/attaches/users/40/20260123081000_8c09085c",
                    "user_hash": "e3de9794296266ae5e8349da0d463347d4809eb3280b1c4f5a5099e68ef0f395"
                },
                "child": {
                    "child_name": "랑구",
                    "child_birth": "2025-01-01",
                    "child_gender": "M"
                }
            }
        ],
        "total_count": 29,
        "cursor": 16
    }
}
  */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import Layout from '../components/Layout';
import Header from '../components/Header';
import styles from '../styles/screens/CommunityScreen.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../libs/contexts/AuthContext';
import { formatDate, diffMonthsFrom, formatRelativeTime } from '@/libs/utils/common';
import {
  useGetCommunities,
  useSoftDeleteCommunity,
  useLikeToggleCommunity,
  useCreateCommunityComment,
  useDeleteCommunityComment
} from '../libs/hooks/useCommunities';
import { useCategoryCodes } from '../libs/hooks/useCategories';
import { Portal, Dialog, Button } from 'react-native-paper';
import { CommunityPost } from '../libs/types/CommunitiesType';
import AdCommunitiyItem, { CommunityAdItem } from '../components/AdCommunitiyItem';
import { getStaticImage, handleViewProfile } from '../libs/utils/common';
import { toastError, toastInfo, toastSuccess } from '@/libs/utils/toast';
import { LoadingPage } from '@/components/Loading';
import ConfirmPortal from '@/components/ConfirmPortal';

type CommunityListItem = CommunityPost | CommunityAdItem;

export default function CommunityScreen({ navigation }: any) {

  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posts, setPosts] = useState<CommunityListItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // 검색 관련 state
  const [searchVisible, setSearchVisible] = useState(false);
  const [titleSearch, setTitleSearch] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'likes' | 'views'>('latest');

  const { data: topicGroups, isLoading: topicGroupsLoading } = useCategoryCodes("TOPIC_GROUP");

  // 전체 카테고리를 포함한 topicGroups
  const topicGroupsWithAll = [
    { code: "topic_000", id: "ALL", is_active: "Y", sort: 0, type: "TOPIC_GROUP", value: "전체" },
    ...(topicGroups || []),
  ];

  const getCommunities = useGetCommunities();
  const deleteCommunity = useSoftDeleteCommunity();
  const likeToggleCommunity = useLikeToggleCommunity();

  const createCommunityCommentMutation = useCreateCommunityComment();
  const deleteCommunityCommentMutation = useDeleteCommunityComment();

  // 커뮤니티 목록 로드
  const loadCommunities = (refresh: boolean = false) => {
    const params = {
      categoryCode: selectedCategory === 'ALL' ? undefined : parseInt(selectedCategory),
      isSecret: 'N',
      cursor: refresh ? undefined : cursor,
      limit: 50,
      keyword: titleSearch || undefined,
      sortBy: sortBy,
    };

    getCommunities.mutate(params, {
      onSuccess: (response) => {
        if (response.success && response.data) {
          const newPosts = response.data.communities.map(post => ({
            ...post,
            // images가 콤마로 구분된 문자열이면 배열로 변환
            images: post.images
              ? typeof post.images === 'string'
                ? post.images.split(',').map(img => img.trim()).filter(img => img)
                : post.images
              : []
          }));
          setPosts(refresh ? newPosts : [...posts, ...newPosts]);
          setCursor(response.data.cursor);
        } else {
          toastError(response.error || '게시글을 불러오는 데 실패했습니다.');
        }
        setIsLoading(false);
        setIsRefreshing(false);
      },
      onError: (error) => {
        console.error('Failed to load communities:', error);
        toastError('게시글을 불러오는 중 오류가 발생했습니다.');
        setIsLoading(false);
        setIsRefreshing(false);
      },
    });
  };

  // 초기 로드 및 카테고리 변경 시
  useEffect(() => {
    setIsLoading(true);
    setPosts([]);
    setCursor(undefined);
    loadCommunities(true);
  }, [selectedCategory]);

  // 화면이 focus될 때 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [selectedCategory])
  );

  // 새로고침
  const handleRefresh = () => {
    setIsRefreshing(true);
    setPosts([]);
    setCursor(undefined);
    loadCommunities(true);
  };

  // 검색 실행
  const handleSearch = () => {
    setIsLoading(true);
    setPosts([]);
    setCursor(undefined);
    setSearchVisible(false);
    loadCommunities(true);
  };

  // 무한 스크롤
  const handleLoadMore = () => {
    if (!isLoading && cursor && cursor > 0) {
      loadCommunities(false);
    }
  };

  // 공감 토글
  const handleLikeToggle = (viewHash: string) => {
    likeToggleCommunity.mutate(viewHash, {
      onSuccess: (response) => {
        if (response.success) {
          updatePostLikeState(viewHash);
          return;
        }
        toastError('공감 처리에 실패했습니다.');
      },
      onError: (error) => {
        toastError('공감 처리 중 오류가 발생했습니다.');
      },
    });

    setPosts(posts.map(post => {
      if (post.view_hash === viewHash) {
        const isLiked = post.is_liked;
        const likeCount = post.like_count || 0;
        return {
          ...post,
          is_liked: isLiked === "Y" ? "N" : "Y",
          like_count: isLiked === "Y" ? ((likeCount < 0)? 0: likeCount - 1) : likeCount + 1,
        };
      }
      return post;
    }));
  };

  // 게시글 수정
  const handleEdit = (viewHash: string) => {
    // TODO: 수정 화면으로 이동
    navigation.navigate('CommunityModify', { viewHash })
  };

  // 게시글 삭제 모달
  const handleDelete = (viewHash: string) => {
    setDeleteDialogVisible(true);
    setPostToDelete(viewHash);
  };

  // 게시글 삭제 취소
  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setPostToDelete(null);
  };

  // 게시글 삭제
  const handelCommunityDelete = () => {
    const viewHash = postToDelete;
    if (!viewHash) return;

    deleteCommunity.mutate(viewHash, {
      onSuccess: (response) => {
        if (response.success) {
          setPosts(posts.filter(post => post.view_hash !== viewHash));
          setDeleteDialogVisible(false);
          setPostToDelete(null);

          // 삭제 후 새로고침
          toastSuccess('게시글이 성공적으로 삭제되었습니다.', {
            onHide: () => {
              handleRefresh();
            },
            onPress: () => {
              handleRefresh();
            }
          });
          return;
        }
        toastError(response.error || '게시글 삭제에 실패했습니다.');
      },
      onError: (error) => {
        toastError('게시글 삭제 중 오류가 발생했습니다.');
      },
    });
  }

  // 게시글 작성
  const handleCreatePost = () => {
    navigation.navigate('CommunityWrite');
  };

  // 댓글 등록
  const handleCommentSubmit = (content: string, parentHash: string | null) => {
    if (!selectedPostId) {
      toastError('게시글 정보가 없습니다.');
      return;
    }

    const mutateParams = {
      community_hash: selectedPostId,
      comment: content,
      parent_hash: parentHash || undefined,
    }

    createCommunityCommentMutation.mutate(mutateParams, {
      onSuccess: () => {
        toastSuccess('댓글이 등록되었습니다.', {
          onHide: () => {
            refetchComments(); // 댓글 목록 새로고침
          },
          onPress: () => {
            refetchComments(); // 댓글 목록 새로고침
          }
        });
      },
      onError: (error) => {
        toastError('댓글 등록 중 오류가 발생했습니다.');
        console.error('Comment create error:', error);
      },
    });
  };

  // 댓글 삭제
  const handleCommentDelete = (commentHash: string) => {
    deleteCommunityCommentMutation.mutate(commentHash,
      {
        onSuccess: () => {
          toastSuccess('댓글이 삭제되었습니다.', {
            onHide: () => {
              refetchComments(); // 댓글 목록 새로고침
            },
            onPress: () => {
              refetchComments(); // 댓글 목록 새로고침
            }
          });
        },
        onError: (error) => {
          toastError('댓글 삭제 중 오류가 발생했습니다.');
          console.error('Comment delete error:', error);
        },
      }
    );
  };

  const renderPost = ({ item }: { item: CommunityListItem }) => {
    if (item.is_ad) {
      return <AdCommunitiyItem item={item} />;
    }

    const isMine = item.user_hash === user?.view_hash;

    // category_code에 맞는 주제 찾기
    const category = topicGroupsWithAll.find(cat => cat.id === item.category_code);
    const categoryName = category ? category.value : '';

    return (
      <View style={styles.postCard}>
        <TouchableOpacity
          style={styles.postItem}
          onPress={() => navigation.navigate('CommunityDetail', { viewHash: item.view_hash })}
          activeOpacity={0.7}
        >
          <View style={styles.postItemContent}>
            <TouchableOpacity
              onPress={() => handleViewProfile(navigation, user?.view_hash, item.user.user_hash)}
              style={styles.postProfileContainer}
            >
              <Image
                source={{ uri: getStaticImage('thumbnail', item.user.profile_image) || '' }}
                style={styles.postProfileImage}
              />
            </TouchableOpacity>
            <View style={styles.postItemRight}>
              {/* 카테고리 태그와 메타 정보 */}
              <View style={styles.postMetaRow}>
                {categoryName && (
                  <View style={styles.postCategoryTag}>
                    <Text style={styles.postCategoryTagText}>{categoryName}</Text>
                  </View>
                )}
                <Text style={styles.postMetaText}>
                  {item.child?.child_name} · {diffMonthsFrom(item.child?.child_birth)}개월
                </Text>
              </View>

              {/* 제목과 내용, 이미지 썸네일 */}
              <View style={styles.postMainContent}>
                <View style={styles.postTextContent}>
                  {/* 제목 */}
                  {item.title && <Text style={styles.postItemTitle} numberOfLines={1}>{item.title}</Text>}

                  {/* 내용 미리보기 */}
                  {item.contents && (
                    <Text style={styles.postItemPreview} numberOfLines={2}>
                      {item.contents}
                    </Text>
                  )}
                </View>

                {/* 이미지 표시 (첫 번째 이미지만 썸네일) */}
                {item.images && item.images.length > 0 && (
                  <Image
                    source={{ uri: getStaticImage('medium', item.images[0]) || '' }}
                    style={styles.postContentImage}
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* 통계 정보 */}
              <View style={styles.postStats}>
                <View style={styles.postStatsRow}>
                  <Ionicons
                    size={16}
                    name={item.is_liked === "Y" ? 'heart' : 'heart-outline'}
                    color={item.is_liked === "Y" ? '#FF8FA3' : '#868E96'}
                  />
                  <Text style={[styles.postStatsText, item.is_liked === "Y" && styles.postStatsTextActive]}>
                    {item.like_count || 0}
                  </Text>
                </View>
                <View style={styles.postStatsRow}>
                  <Ionicons name="chatbubble-outline" size={16} color="#868E96" />
                  <Text style={styles.postStatsText}>{item.comment_count || 0}</Text>
                </View>
              </View>

              {/* 내 게시글인 경우 수정/삭제 버튼 */}
              {isMine && (
                <View style={styles.postActionButtons}>
                  <TouchableOpacity
                    style={styles.postEditButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(item.view_hash);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#495057" />
                    <Text style={styles.postEditButtonText}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.postDeleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(item.view_hash);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                    <Text style={styles.postDeleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Layout>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>커뮤니티</Text>
            <Text style={styles.headerSubtitle}>함께 나누는 육아 이야기</Text>
          </View>
          <TouchableOpacity style={styles.writeButton} onPress={handleCreatePost}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.writeButtonText}>글쓰기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 주제 카테고리 탭 */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {topicGroupsWithAll.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.tabButton,
                selectedCategory === category.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedCategory === category.id && styles.tabButtonTextActive,
                ]}
              >
                {category.value}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 검색 필터 */}
      {searchVisible && (
        <View style={styles.searchContainer}>
          {/* 제목 검색 */}
          <View style={styles.searchRow}>
            <Text style={styles.searchLabel}>제목</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="제목 검색"
              placeholderTextColor="#ADB5BD"
              value={titleSearch}
              onChangeText={setTitleSearch}
            />
          </View>

          {/* 정렬 */}
          <View style={styles.searchRow}>
            <Text style={styles.searchLabel}>정렬</Text>
            <View style={styles.sortContainer}>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'latest' && styles.sortButtonActive]}
                onPress={() => setSortBy('latest')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'latest' && styles.sortButtonTextActive]}>
                  최신순
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'likes' && styles.sortButtonActive]}
                onPress={() => setSortBy('likes')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'likes' && styles.sortButtonTextActive]}>
                  좋아요순
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortButton, sortBy === 'views' && styles.sortButtonActive]}
                onPress={() => setSortBy('views')}
              >
                <Text style={[styles.sortButtonText, sortBy === 'views' && styles.sortButtonTextActive]}>
                  조회순
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 검색 버튼 */}
          <View style={styles.searchButtonRow}>
            <TouchableOpacity
              style={styles.searchSubmitButton}
              onPress={handleSearch}
            >
              <Ionicons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.searchSubmitButtonText}>검색</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 게시글 목록 */}
      {isLoading ? (
        <LoadingPage title="커뮤니티 정보를 불러오는 중"/>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => `${item.is_ad ? 'ad' : 'community'}-${item.id}`}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FF9AA2"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && posts.length > 0 ? (
              <ActivityIndicator size="small" color="#FF9AA2" style={{ marginVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            !isRefreshing ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#DEE2E6" />
                <Text style={styles.emptyText}>아직 게시글이 없습니다</Text>
                <Text style={styles.emptySubText}>첫 번째 게시글을 작성해보세요!</Text>
              </View>
            ) : null
          }
        />
      )}
      {/* 플로팅 액션 버튼 제거 - 헤더에 글쓰기 버튼 있음 */}

      {/* 내 게시글 삭제 */}
      <ConfirmPortal
        visible={deleteDialogVisible}
        title="게시글 삭제"
        message="삭제하시겠습니까?"
        confirmText="삭제"
        confirmTextColor="#FF6B6B"
        onCancel={cancelDelete}
        onConfirm={handelCommunityDelete}
      />
    </Layout>
  );
}