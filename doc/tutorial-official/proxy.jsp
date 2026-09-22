<%@page session="true" %>
<%@page import="java.util.Set" %>
<%@page import="java.util.Map" %>
<%@page import="java.util.HashMap" %>
<%@page import="java.util.Iterator" %>
<%@page import="java.net.*" %>
<%@page import="java.io.*" %>
<%@page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%

    OutputStream ostream = null;
    InputStream in = null;

    try {

        String orginalUrl = "url";

        //int connectTimeout = 20000;		// [millisecond]
        //int readTimeout = 20000;			// [millisecond]
        int maxInactiveInterval = 3600;        // [second]

        // session 갱신
        request.getSession().setMaxInactiveInterval(maxInactiveInterval);

        //System.out.println("start session id : " + request.getSession().getId());

        // 한글인코딩
        request.setCharacterEncoding("UTF-8");    // tomcat server.xml UTF-8로 수정필요

        // GET방식에서 key, value를 url에 넣는 과정
        Map paramMap = request.getParameterMap();

        // post, get에서 쓸 url을 각각 지정
        String reqUrl = ((String[]) paramMap.get(orginalUrl))[0];

        // kvp 파라미터 정리
        String middleUrl = "";

        if (reqUrl.indexOf("?") == -1) {
            reqUrl = reqUrl + "?";
        } else {
            if (reqUrl.charAt(reqUrl.length() - 1) != '?') {
                String[] tempUrl = reqUrl.split("\\?");
                String[] midUrl = tempUrl[1].split("\\=");
                if (midUrl.length == 2) {
                    middleUrl = midUrl[0] + "=" + URLEncoder.encode(midUrl[1], "UTF-8") + "&";
                    // System.out.println("key : " + midUrl[0] + " ,     value : " + midUrl[1]);
                }
                reqUrl = tempUrl[0] + "?";
            }
        }

        Iterator iterator = paramMap.keySet().iterator();

        while (iterator.hasNext()) {
            try {
                String key = (String) iterator.next();

                if (key.equalsIgnoreCase(orginalUrl)) {
                    continue;
                }

                String values[] = (String[]) paramMap.get(key);

                if (values[0] != null) {
//				middleUrl = middleUrl + key.toUpperCase() + "=" + URLEncoder.encode(values[0], "UTF-8") + "&";
                    middleUrl = middleUrl + key + "=" + URLEncoder.encode(values[0], "UTF-8") + "&";
                }

                // System.out.println("key : " + key + " ,     value : " + values[0]);
            }catch (Exception e){
                throw new Exception();
            }
        }

        String resultUrl = reqUrl + middleUrl;

        if (resultUrl.endsWith("?")) {
            resultUrl = resultUrl.substring(0, resultUrl.length() - 1);
        }

        URL url = null;
        HttpURLConnection con = null;

        if (request.getMethod().equalsIgnoreCase("GET")) {        // GET Method

            url = new URL(resultUrl);
            // System.out.println("request : (" + request.getMethod() + ") "+ resultUrl);

            con = (HttpURLConnection) url.openConnection();
            try{
                con.setDoOutput(true);
                con.setRequestMethod(request.getMethod());
                con.setRequestProperty("charset", "UTF-8");

                String userAuthHeader = request.getHeader("User-Authorization");
                if(userAuthHeader != null && userAuthHeader != ""){
                    con.setRequestProperty("User-Authorization", userAuthHeader);
                }
            }catch (Exception e){
                con.disconnect();
                throw new Exception();
            }

            //con.setConnectTimeout(connectTimeout);
            //con.setReadTimeout(readTimeout);
            //System.out.println("connectTimeout : " + connectTimeout);
            //System.out.println("readTimeout : " + readTimeout);

        } else {        // POST Method

            url = new URL(reqUrl);
            // System.out.println("request : (" + request.getMethod() + ") "+ reqUrl);

            String cType = request.getContentType();



            if (cType != null && cType.contains("multipart/form-data") == true) {    // multipart/form-data

                con = (HttpURLConnection) url.openConnection();
                try{
                    con.setDoOutput(true);
                    con.setRequestMethod(request.getMethod());
                    con.setRequestProperty("Content-Type", cType);

                    String userAuthHeader = request.getHeader("User-Authorization");
                    if(userAuthHeader != null && userAuthHeader != ""){
                        con.setRequestProperty("User-Authorization", userAuthHeader);
                    }
                }catch (Exception e){
                    con.disconnect();
                    throw new Exception();
                }

                //con.setConnectTimeout(connectTimeout);
                //con.setReadTimeout(readTimeout);
                //System.out.println("connectTimeout : " + connectTimeout);
                //System.out.println("readTimeout : " + readTimeout);

                int clength = request.getContentLength();
                InputStream istream = null;
                OutputStream os = null;
                try{
                    if (clength > 0) {
                        con.setDoInput(true);
                        istream = request.getInputStream();
                        os = con.getOutputStream();
                        final int length = 10000;
                        byte[] bytes = new byte[length];
                        int bytesRead = 0;
                        while ((bytesRead = istream.read(bytes, 0, length)) > 0) {
                            os.write(bytes, 0, bytesRead);
                        }
                    }

                    if (os != null) {
                        os.flush();
                        os.close();
                        os = null;
                    }

                    if (istream != null) {
                        istream.close();
                        istream = null;
                    }
                }catch (Exception e){
                    con.disconnect();
                    if (os != null) {
                        os.flush();
                        os.close();
                        os = null;
                    }

                    if (istream != null) {
                        istream.close();
                        istream = null;
                    }
                    throw new Exception();
                }
            } else {
                StringBuilder sb = new StringBuilder();
                InputStreamReader is = new InputStreamReader(request.getInputStream());
                BufferedReader br = new BufferedReader(is);
                try{
                    String read = br.readLine();

                    while (read != null) {
                        sb.append(read);
                        read = br.readLine();
                    }

                    String strBody = sb.toString();
                    // System.out.println("before body : " + strBody);

                    con = (HttpURLConnection) url.openConnection();
                    con.setRequestMethod(request.getMethod());
                    con.setDoOutput(true);
                    con.setUseCaches(false);
                    con.setRequestProperty("charset", "UTF-8");

                    String userAuthHeader = request.getHeader("User-Authorization");
                    if(userAuthHeader != null && userAuthHeader != ""){
                        con.setRequestProperty("User-Authorization", userAuthHeader);
                    }

                    //con.setConnectTimeout(connectTimeout);
                    //con.setReadTimeout(readTimeout);
                    //System.out.println("connectTimeout : " + connectTimeout);
                    //System.out.println("readTimeout : " + readTimeout);

                    if (strBody.trim().startsWith("<")) {
                        // XML of Post Method
                        con.setRequestProperty("Content-Type", "application/xml");
                    } else {
                        // KVP of Post Method
                        strBody = strBody + middleUrl;
                        con.setRequestProperty("Content-Type", request.getContentType());
                    }

                    // System.out.println("after body : " + strBody);
                    // StringBuilder를 byte화 시켜서 post로 넘어온 데이터를 담는다
                    byte[] postData = strBody.getBytes();
                    con.setRequestProperty("Content-Length", Integer.toString(postData.length));
                    con.getOutputStream().write(postData);
                }catch (Exception e){
                    is.close();
                    br.close();
                    con.disconnect();
                }
                // POST방식에서 inputStream을 StringBuilder에 붙임

            }

        }

        out.clear();
        out = pageContext.pushBody();


        String reqStr = middleUrl.toUpperCase();
        if (reqStr.contains("VP_EXPORTVECTOR")) {

            response.setContentType("application/octet-stream");
            String fileName = "download";

            int idx = reqStr.indexOf("SRCLAYER");
            if (idx != -1) {
                fileName = reqStr.substring(idx + 9, reqStr.indexOf("&", idx));
            }

            idx = reqStr.indexOf("EXPORTTYPE");
            if (idx != -1) {
                String extName = reqStr.substring(idx + 11, reqStr.indexOf("&", idx));
                if (extName.equalsIgnoreCase("SHP")) {
                    fileName = fileName + ".zip";
                } else if (extName.equalsIgnoreCase("EXCEL")) {
                    fileName = fileName + ".xls";
                }
            }

            response.setHeader("Content-Disposition", "attachment;filename=" + fileName + ";");
        } else {
            response.setContentType(con.getContentType());
        }


        ostream = response.getOutputStream();
        in = con.getInputStream();//다음지도 여기서 exception 발생

        try{
            final int length = 10000;
            byte[] bytes = new byte[length];
            int bytesRead = 0;
            while ((bytesRead = in.read(bytes, 0, length)) > 0) {
                ostream.write(bytes, 0, bytesRead);
            }
        }catch (Exception e){
            ostream.flush();
            ostream.close();
            in.close();
            con.disconnect();
            throw new Exception();
        }


    } catch (Exception e) {

       // System.out.println("*** proxy exception : " + e);
        if (e instanceof FileNotFoundException) {
            response.setStatus(404);
        } else {
            response.setStatus(500);
        }

    } finally {

        //System.out.println("end session id :   " + request.getSession().getId());

        //System.out.println("");
        //System.out.println("*** proxy end");
        //System.out.println("");

        if (ostream != null) {
            ostream.flush();
            ostream.close();
            ostream = null;
        }

        if (in != null) {
            in.close();
            in = null;
        }

    }
%>