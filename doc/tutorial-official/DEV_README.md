#예제페이지 작업요령 
 - 예제페이지 개발시 원할한 작업을 위해 requireJS를 사용해
   원 소스를 바로 사용하여 개발하도록 구축되어있습니다
 - requireJS 사용함에따라 몇가지 규칙을 지켜 작성합니다.
###1. 개발용 스크립트 파일
`[tutorial/js/dev]` 스크립트 파일들은 개발시에만 적용되는 스크립트이며   npm run tutorial 시에 동적으로 제거(또는 치환)됩니다.
- **commonscript.js** : 공통 라이브러리 동적 import
- **config.js** : requireJS 설정 파일
- **require.js** 

###2. commonscript.js 사용시 유의사항

개발용 스크립트는 `dev`속성을 추가해서 사용합니다. 빌드시에 `dev` 속성을 가진 script 태그는 삭제됩니다.

      <script src="js/dev/commonscript.js" dev="true"></script>
  


###3. requireJS 사용시 유의사항
Union3D 라이브러리를 사용하는 코드는 require()함수를 사용해야하며, 전 소스가 require 함수 스코프에 포함되어야합니다.

예) 빌드시에 `****`로 표시된 영역의 require 함수 내부 문자열만 배포됩니다.

        require(['app/Union3D'], function (Union3D) {
           **** 배포 Start ****
           Union3D.ready(function () {
            ... 개발 내용 ...
           });
           **** 배포 END ****
        });
       ... 이후 작성내용은 배포되지 않음 ...

_배포내용 체크는 `<script>` 태그 단위로 수행하며, 해당 태그내에 `require`를 사용하지 않았다면 그대로 배포됩니다._


_본파일도 배포대상에서 제외됩니다._
