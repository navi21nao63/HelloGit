//
// (1)実行の仕方：コマンドプロンプトから右記のように入力する　
//		node crsoukan1 yyyymmdd
// (2)処理の内容：
//		ファイルの中身を読み込み銘柄コードを抽出し、配列arrに入れる
//		配列arr内の数字の全組合せ（nC2←順列ではない)だ、銘柄1と銘柄2のペアを抽出する。
//　　　　　抽出されたペア毎に、関数soukanにより相関係数を算出する
//		計算する相関係数の期間は,全レコード分、過去1年分、過去6か月分、過去3か月分,過去1か月分。
//		処理の結果の表示。（銘柄件数、組合せ数、処理時間
// (3)実行の前提条件　
//  (3-1).
//　		計算上、全ての銘柄ペアのレコード件数は同じでもある必要がある。もし違えば、相関値はNaNになる
//		また、csv内の数値項目のフォーマット形式は""で囲まれていない(数値）であることが必要
// 		Excelで編集時に列のformat形式がgeneralに設定して保存することで""がはずれる
//  (3-2).入力ファイルのレイアウト kabukaYYYYMMDD.csv
//		日付[0],銘柄コード[1],、出来高[2],始値[3],高値[4],安値[5],終値[6],調整済値[7] 
//  (3-3).出力ファイルのレイアウト soukanYYYYMMDD.csv
//		銘柄コード1,銘柄コード2,相関係数(全レコード),(直近12か月),(直近6か月)　,(直近3か月),(直近1か月)スコア
//		※　スコア　各々の相関係数が80%以上なら1ポイント、90%以上なら２ポイント　各々のポイントを足す

	var label = 'for-loop';					//処理経過時間計測のための変数
	console.time(label);					//処理経過時間計測のための変数

	var fs = require('graceful-fs');	//大量データを処理すると通常のfsだとtoo many open fileとエラーになるためgraceful-fsに置き換える
	var inputF =  "./data/kabuka"+process.argv[2]+".csv" ; 	// 編集するファイル名=kabukayyyymmdd.csv
	var outputF = "./data/soukan"+process.argv[2]+".csv"　;	// 編集結果を出力するファイル名＝soukanyyyymmdd.csv
	var outdata = ""
	var soukanR = [];			;	//関数からの戻り値　相関係数（[0]全レコード,[1]直近12か月,[2]直近6か月.[3]直近3か月	
	var date = new Date();
	var combiNo = 0;

	var CSVObject = require('csv-lite').CSVObject; 	//csvライブラリーの読み込みに必要
	var csv = new CSVObject();						//csvライブラリーの読み込みに必要
	var arr = [];

	// ファイルの読み込み
	
	csv.readFileSync(inputF, 'sjis');	
	var meigaraAll = csv.findAll(0, '2015/1/5');	//inputファイル内に存在する銘柄コードを抜き出す
	meigaraAll_len = meigaraAll.length;				//銘柄コードの総件数を把握する
		for (m=0;m<meigaraAll_len;m++){				//銘柄コードを1次元配列arrに読み込む
			arr[m]= meigaraAll[m][1];
		}
	
	len = arr.length;
	x = [];
// 組み合わせのループを生成し、組み合わせごとに関数mySoukanを呼び出し相関係数を算出する
	for(i=0;i<len;i++)
	for(j=i;j<len;j++)
	if(arr[i]!==arr[j]){
		soukanR = mySoukan(arr[i],arr[j]);　　//相関係数算出の関数を呼び出し、戻り値として配列soukanRに取り込む
		//console.log(arr[i]+" "+arr[j]+" "+soukanR[1]);
		//console.log(arr[i]+" "+arr[j]);
		var score = 0;
		if (soukanR[0]>=0.8){score +=1}		//scoreの計算  相関2Y	
		if (soukanR[1]>=0.9){score +=2}		// 相関1Y
		else if (soukanR[1]>=0.8){score +=1}	// 相関1Y
		if (soukanR[2]>=0.8){score +=1}		// 相関6M
		if (soukanR[3]>=0.8){score +=1}		// 相関3M
		
		outdata = arr[i]+","+arr[j]+","+soukanR[0]+","+soukanR[1]+","+soukanR[2]+","+soukanR[3]+","+soukanR[4]+","+score+"\n";
		fs.appendFile(outputF, outdata);　	// 出力ファイルに追記する
			combiNo += 1;
	}
	console.log("input file="+inputF);
	console.log("output file="+outputF);
	console.log("銘柄数="+meigaraAll_len+" 組合せ数="+combiNo)
	console.timeEnd(label);					//処理経過時間計測のための変数
	
// 関数の処理の内容
// ファイルを読み込み、銘柄Aと銘柄Bの各々の平均値や２つの銘柄間の相関係数を算出する

function mySoukan(m1, m2)
{

	var meigaraA = m1; 	//銘柄Aのコード
	var meigaraB = m2;	//銘柄Bのコード
	var owarineSumA = 0 ;	//銘柄Aの終値の合計
	var owarineSumB = 0 ;	//銘柄Bの終値の合計
	var owarineAveA = 0 ;	//銘柄Aの終値の平均
	var owarineAveB = 0 ;	//銘柄Bの終値の平均
	var countA = 0 ;		//銘柄Aの個数
	var countB = 0 ;		//銘柄Bの個数

	var owarineSumA1 = 0 ;	//銘柄Aの終値の合計(直近1か月)
	var owarineSumB1 = 0 ;	//銘柄Bの終値の合計(直近1か月)
	var owarineAveA1 = 0 ;	//銘柄Aの終値の平均(直近1か月)
	var owarineAveB1 = 0 ;	//銘柄Bの終値の平均(直近1か月)
	var countA1 = 0 ;		//銘柄Aの個数(直近1か月)
	var countB1 = 0 ;		//銘柄Bの個数(直近1か月)
	
	var owarineSumA3 = 0 ;	//銘柄Aの終値の合計(直近3か月)
	var owarineSumB3 = 0 ;	//銘柄Bの終値の合計(直近3か月)
	var owarineAveA3 = 0 ;	//銘柄Aの終値の平均(直近3か月)
	var owarineAveB3 = 0 ;	//銘柄Bの終値の平均(直近3か月)
	var countA3 = 0 ;		//銘柄Aの個数(直近3か月)
	var countB3 = 0 ;		//銘柄Bの個数(直近3か月)
	
	
	var owarineSumA6 = 0 ;	//銘柄Aの終値の合計(直近6か月)
	var owarineSumB6 = 0 ;	//銘柄Bの終値の合計(直近6か月)
	var owarineAveA6 = 0 ;	//銘柄Aの終値の平均(直近6か月)
	var owarineAveB6 = 0 ;	//銘柄Bの終値の平均(直近6か月)
	var countA6 = 0 ;		//銘柄Aの個数(直近6か月)
	var countB6 = 0 ;		//銘柄Bの個数(直近6か月)
	
	var owarineSumA12 = 0 ;	//銘柄Aの終値の合計(直近12か月)
	var owarineSumB12 = 0 ;	//銘柄Bの終値の合計(直近12か月)
	var owarineAveA12 = 0 ;	//銘柄Aの終値の平均(直近12か月)
	var owarineAveB12 = 0 ;	//銘柄Bの終値の平均(直近12か月)
	var countA12 = 0 ;		//銘柄Aの個数(直近12か月)
	var countB12 = 0 ;		//銘柄Bの個数(直近12か月)
	
	
	var hensaA = 0;			//偏差A(銘柄Aの終値-平均A)の合計 
	var hensaB =	0;		//偏差B(銘柄Bの終値-平均B)の合計 

	var hensaA1 = 0;		//偏差A(銘柄Aの終値-平均A)の合計(直近1か月) 
	var hensaB1 =	0;		//偏差B(銘柄Bの終値-平均B)の合計(直近1か月) 
	var hensaA3 = 0;		//偏差A(銘柄Aの終値-平均A)の合計(直近3か月) 
	var hensaB3 =	0;		//偏差B(銘柄Bの終値-平均B)の合計(直近3か月) 
	var hensaA6 = 0;		//偏差A(銘柄Aの終値-平均A)の合計(直近6か月) 
	var hensaB6 =	0;		//偏差B(銘柄Bの終値-平均B)の合計(直近6か月) 
	var hensaA12 = 0;		//偏差A(銘柄Aの終値-平均A)の合計(直近12か月) 
	var hensaB12 =	0;		//偏差B(銘柄Bの終値-平均B)の合計(直近12か月) 
	
	
	var heikinsaSeki = 0;	//(銘柄Aの終値-平均A) x (銘柄Bの終値-平均B) の合計
	
	var hensaA2 = 0; 		// 偏差Aの2乗の合計
	var hensaB2 = 0;		// 偏差Bの2乗の合計
	var hensaA21 = 0; 		// 偏差Aの2乗の合計(直近1か月) 
	var hensaB21 = 0;		// 偏差Bの2乗の合計(直近1か月) 
	var hensaA23 = 0; 		// 偏差Aの2乗の合計(直近3か月) 
	var hensaB23 = 0;		// 偏差Bの2乗の合計(直近3か月) 
	var hensaA26 = 0; 		// 偏差Aの2乗の合計(直近6か月) 
	var hensaB26 = 0;		// 偏差Bの2乗の合計(直近6か月) 
	var hensaA212 = 0; 		// 偏差Aの2乗の合計(直近12か月) 
	var hensaB212 = 0;		// 偏差Bの2乗の合計(直近12か月) 
	
	var bunsanA = 0 ;		// 分散　偏差Aの2乗の平均値
	var bunsanA1 = 0 ;		// 分散　偏差Aの2乗の平均値(直近1か月)
	var bunsanA3 = 0 ;		// 分散　偏差Aの2乗の平均値(直近3か月)
	var bunsanA6 = 0 ;		// 分散　偏差Aの2乗の平均値(直近6か月)
	var bunsanA12 = 0 ;		// 分散　偏差Aの2乗の平均値(直近12か月)
	var bunsanB = 0 ;		// 分散 偏差Bの2乗の平均値
	var bunsanB1 = 0 ;		// 分散　偏差Aの2乗の平均値(直近1か月)
	var bunsanB3 = 0 ;		// 分散　偏差Aの2乗の平均値(直近3か月)
	var bunsanB6 = 0 ;		// 分散　偏差Aの2乗の平均値(直近6か月)
	var bunsanB12 = 0 ;		// 分散　偏差Aの2乗の平均値(直近12か月)
	
	var hensaAB = 0 ;       // (銘柄Aの偏差　x 銘柄Bの偏差)
	var hensaAB1 = 0 ;      // (銘柄Aの偏差　x 銘柄Bの偏差)(直近1か月)
	var hensaAB3 = 0 ;      // (銘柄Aの偏差　x 銘柄Bの偏差)(直近3か月)
	var hensaAB6 = 0 ;      // (銘柄Aの偏差　x 銘柄Bの偏差)(直近6か月)
	var hensaAB12 = 0 ;     // (銘柄Aの偏差　x 銘柄Bの偏差)(直近12か月)
	
	var stdhensaA = 0 ;		// 標準偏差A
	var stdhensaB = 0 ;		//　標準偏差B
	var kyobunsan = 0 ;		// 共分散　Σ(銘柄Aの偏差　x 銘柄Bの偏差)の平均
	
	 // 銘柄Aのデータを抽出
	var res1 = csv.findAll(1, meigaraA);
	
	// 配列array1のレイアウト　
	//	日付[0],銘柄aのコード[1]銘柄aの終値[2],日付[3],銘柄bのコード[4],銘柄bの終値[5]	
	//	偏差(銘柄A終値-平均A)[6],偏差(銘柄B終値-平均B)[7],(偏差a X 偏差 b)[8]
	　
	array1 = new Array(res1.length)
	var res1_length= res1.length;
	
		for (y=0;  y < res1_length; y++){
			array1[y]= new Array(9)
		}
		var lengthA	= res1_length;
		var month1	= res1_length-20; 	//1か月前 	res1.length-20daysX1
		var month3	= res1_length-60; 	//3か月前 	res1.length-20daysX3
		var month6	= res1_length-120; 	//6か月前 	res1.length-20daysX6
		var month12 = res1_length-240; 	//1年前　	res1.length-20daysX12
	
	 // 銘柄Aのデータを配列に入れる
	for (var i in res1) {
		var row1 = res1[i];
		  array1[i][0]=row1[0];
		  array1[i][1]=row1[1];
		  array1[i][2]=row1[7];
		  owarineSumA = owarineSumA + row1[7];
		  countA = countA　+ 1
			if (i> month12){
				owarineSumA12 = owarineSumA12 + row1[7]
			countA12 = countA12 + 1}
			if (i> month6){
				owarineSumA6 = owarineSumA6 + row1[7]
			countA6 = countA6 + 1}
			if (i> month3){
				owarineSumA3 = owarineSumA3 + row1[7]
			countA3 = countA3 + 1}
			if (i> month1){
				owarineSumA1 = owarineSumA1 + row1[7]
			countA1 = countA1 + 1}
		var owarineA = row1[7];
	} 
		
		owarineAveA = owarineSumA / countA
		owarineAveA12 = owarineSumA12 / countA12
		owarineAveA6  = owarineSumA6  / countA6
		owarineAveA3  = owarineSumA3  / countA3
		owarineAveA1  = owarineSumA1  / countA1
	
	 // 銘柄Bのデータを抽出
	var res2 = csv.findAll(1, meigaraB);
	 // 銘柄Bのデータを配列に入れる
		for (var i in res2) {
			var row2 = res2[i];
			  array1[i][3]=row2[0];
			  array1[i][4]=row2[1];
			  array1[i][5]=row2[7];
			  owarineSumB = owarineSumB + row2[7];
			  countB = countB　+ 1
			 
			if (i> month12){
				owarineSumB12 = owarineSumB12 + row2[7]
				countB12 = countB12 + 1}
			if (i> month6){
				owarineSumB6 = owarineSumB6 + row2[7]
				countB6 = countB6 + 1}
			if (i> month3){
				owarineSumB3 = owarineSumB3 + row2[7]
				countB3 = countB3 + 1}
			if (i> month1){
				owarineSumB1 = owarineSumB1 + row2[7]
				countB1 = countB1 + 1}
			var owarineB = row2[7];
		}
		owarineAveB = owarineSumB / countB ;
		owarineAveB12 = owarineSumB12 / countB12 ;
		owarineAveB6 = owarineSumB6 / countB6 ;
		owarineAveB3 = owarineSumB3 / countB3 ;
		owarineAveB1 = owarineSumB1 / countB1 ;
		 
		var ary1len= array1.length;
		for (var x=0 ; x < ary1len ; x++) {
			array1[x][6]= array1[x][2]-owarineAveA;				// 偏差(銘柄A終値-平均A)を配列6に 
			array1[x][7]= array1[x][5]-owarineAveB;				// 偏差(銘柄B終値-平均B)を配列７に入れる　
			array1[x][8]= array1[x][6] * array1[x][7];			// 配列6　x 配列 7 を配列 8に入れる
			hensaA = hensaA + array1[x][6];
			hensaB = hensaB + array1[x][7];
			heikinsaSeki = heikinsaSeki + array1[x][8];
			
			// 分散の計算：偏差A,Bの2乗の合計を計算する
			 hensaA2 = hensaA2 + (array1[x][6] * array1[x][6]);	// 総和　偏差A X 偏差A
			 hensaB2 = hensaB2 + (array1[x][7] * array1[x][7]);	// 総和　偏差B X 偏差B
			 hensaAB = hensaAB + (array1[x][6] * array1[x][7]);	// 総和　偏差A x 偏差B
			 
			 if (x > month12){
				 hensaA212 += (array1[x][2]-owarineAveA12)*(array1[x][2]-owarineAveA12)
				 hensaB212 += (array1[x][5]-owarineAveB12)*(array1[x][5]-owarineAveB12)
				 hensaAB12 += (array1[x][2]-owarineAveA12)*(array1[x][5]-owarineAveB12)
			 }
			 if (x > month6){
				 hensaA26 += (array1[x][2]-owarineAveA6)*(array1[x][2]-owarineAveA6)
				 hensaB26 += (array1[x][5]-owarineAveB6)*(array1[x][5]-owarineAveB6)
				 hensaAB6 += (array1[x][2]-owarineAveA6)*(array1[x][5]-owarineAveB6)
			 }
			 if (x > month3){
				 hensaA23 += (array1[x][2]-owarineAveA3)*(array1[x][2]-owarineAveA3)
				 hensaB23 += (array1[x][5]-owarineAveB3)*(array1[x][5]-owarineAveB3)
				 hensaAB3 += (array1[x][2]-owarineAveA3)*(array1[x][5]-owarineAveB3)
			 }
			if (x > month1){
				 hensaA21 += (array1[x][2]-owarineAveA1)*(array1[x][2]-owarineAveA1)
				 hensaB21 += (array1[x][5]-owarineAveB1)*(array1[x][5]-owarineAveB1)
				 hensaAB1 += (array1[x][2]-owarineAveA1)*(array1[x][5]-owarineAveB1)
			 }				
				
			bunsanA = hensaA2 / x 			;					//分散A
			bunsanA1 = hensaA21 / month1	;					//分散A(直近1か月)
			bunsanA3 = hensaA23 / month3	;					//分散A(直近3か月)
			bunsanA6 = hensaA26 / month6	;					//分散A(直近6か月)
			bunsanA12 = hensaA212 / month12	;					//分散A(直近12か月)
			bunsanB = hensaB2 / x			;					//分散B
			bunsanB1 = hensaB21 / month1	;					//分散B(直近1か月)	
			bunsanB3 = hensaB23 / month3	;					//分散B(直近3か月)	
			bunsanB6 = hensaB26 / month6	;					//分散B(直近6か月)	
			bunsanB12 = hensaB212 / month12	;					//分散B(直近12か月)
			
			kyobunsan = hensaAB / x ;							//共分散
			stdhensaA = Math.sqrt(bunsanA); 					//標準偏差A
			stdhensaB = Math.sqrt(bunsanB); 					//標準偏差B
			soukanR[0] = kyobunsan / (stdhensaA*stdhensaB) ; 	//相関係数算出式
			soukanR[1] =(hensaAB12 / month12) / (Math.sqrt(bunsanA12)*Math.sqrt(bunsanB12));	//相関係数(直近12か月)
			soukanR[2] =(hensaAB6  / month6 ) / (Math.sqrt(bunsanA6 )*Math.sqrt(bunsanB6 )); 	//相関係数(直近6か月)
			soukanR[3] =(hensaAB3  / month3 ) / (Math.sqrt(bunsanA3 )*Math.sqrt(bunsanB3 )); 	//相関係数(直近3か月)
			soukanR[4] =(hensaAB1  / month1 ) / (Math.sqrt(bunsanA1 )*Math.sqrt(bunsanB1 )); 	//相関係数(直近1か月)
			

		};  
		return soukanR;
}
	
