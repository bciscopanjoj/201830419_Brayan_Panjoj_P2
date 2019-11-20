//Tablas para caracteres/Identificadores/Tokens/Constantes/Errores Lexicos y Sintacticos

var tablaCaracteres = 0;										
var tablaIdentificadores = 0;							    
var tablaTokens = 0;										
var tablaCondiciones = 0;									
var tablaErrosLexicos = 0;								 	
var tablaErrosSintaticos = 0;								
//var codigoCompilado = "";

//Contiene tokens aceptados por el analizador (identidficador=-1/ cosntante=-2)

var caracteres = {'"' : 29, "'" : 30};
var delimitadores = {"{" : 32, "}" : 33, "(" : 34, ")" : 35, ',' : 36, "." : 37};
var atributos = {"=" : 2};					
var comentario = {"//" : 1};					
var puntoyComa = {";" : 31};						
var operadores = {"==" : 3,">" : 4,"<" : 5,">=" : 6,"<=" : 7,"!=" : 8,"&&" : 9,"||" : 10, "!" : 11,"%" : 12,"+" : 13, "-" : 14,"/" : 15, "*" : 16,"^" : 17};
var palabrasReservadas = {"if" : 18, "else" : 19, "continue" : 20, "break" : 21, "while" : 22, "print" : 23, "read" : 24, "int" : 25, "float" : 26, "string" : 27, "char" : 28};




//Muestra las filas del archivo en una tabla 
function lerArquivo(evento) {
	var arquivo = evento.target.result.split('\n');
	var div = "<table border='0' cellpadding='0' cellspacing='0' class='centered'><td class='gutter' style='    padding-top: 6px!important; padding-left: 6px!important; color: rgb(100, 178, 134)!important;'>";

	for (var i = 0; i < arquivo.length; i++) div = div + "<div class='line number3 index2 alt2' >"+i+"</div>";
	div = div + "</td><td><pre class='language-c'><code class='language-c'>";
	
	for (var i = 0; i < arquivo.length; i++) {
		if (arquivo[i] == '') codeLine = '\n';
		else codeLine = arquivo[i];
		div += "<div class='codeLine' style='    text-align: left;'>"+ codeLine+'</div>';
	}

	div += "</code></pre></td></tr></table>";
	var arquivoSaidaDiv = document.getElementById('arquivoSaida');
	arquivoSaidaDiv.innerHTML = div;
	arquivoSaidaDiv.classList.remove("ocultar-div");

	// Limpia la informacion de lo paneles
	var h5MessageElement = document.getElementById('tabelaToken');
	h5MessageElement.innerHTML = "";

	var h5MessageElement = document.getElementById('tabelaConst');
	h5MessageElement.innerHTML = "";

	var h5MessageElement = document.getElementById('tabelaLite');
	h5MessageElement.innerHTML = "";

	var h5MessageElement = document.getElementById('tabelaVariaveis');
	h5MessageElement.innerHTML = "";

	var h5MessageElement = document.getElementById('tabelaErrosLexicos');
	h5MessageElement.innerHTML = "";

	var h5MessageElement = document.getElementById('tabelaErrosSintatico');
	h5MessageElement.innerHTML = "";
	
	zip = new JSZip();

	main(arquivo);
}




//Esta parte verifica si un carácter es un número o no
function isLetter(str) {
	return str != undefined && str.match(/[a-z]/i) != null;
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  //Descarga 

  function download_tabelas() {
	var content = zip.generate({type:"blob"});
	saveAs(content, "tabelas.zip");
}

// esta parte lee espacios, separador o número para ser analizado como un token. 

function consumirEspacos(linhaDoArquivo, sentinela, lookAhead){
	var newSentinela = sentinela.value;
	
	 while ((newSentinela < linhaDoArquivo.length) && (linhaDoArquivo[newSentinela] == " " || linhaDoArquivo[newSentinela] == '\t')){
		 newSentinela++;
	}
	
	if (newSentinela != sentinela.value){
		sentinela.value = newSentinela;
		lookAhead.value = newSentinela + 1;
	
	} else if (linhaDoArquivo[newSentinela] == undefined && newSentinela+1 >= linhaDoArquivo.length){
		sentinela.value = newSentinela + 1;
		lookAhead.value = newSentinela + 2;
	}
}



//Aqui inserta el comentario en la tabla de tokens con su línea y columna en el código -1 ya que no hace referencia a otra tabla

function tratarComentario (tablaTokens, linhaDoArquivo, sentinela, lookAhead, linhaAtual) {
	var idDelimitador = comentario["//"];
	
	inserirTabelaTokens(tablaTokens, idDelimitador, linhaAtual, sentinela.value, -1);
	lookAhead.value = linhaDoArquivo.length;
	sentinela.value = lookAhead.value;
}


//Inserta el delimitador en la tabla de tokens

function tratarDelimitadores (tablaTokens, arquivoLinhaAtual, linhaAtual, sentinela, lookAhead) {
	var idDelimitador;

	var valor = Object.keys(delimitadores).map(function(key){
    	idDelimitador = delimitadores[arquivoLinhaAtual[sentinela.value]];
	});

	inserirTabelaTokens(tablaTokens, idDelimitador, linhaAtual, sentinela.value, -1);
	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;
	consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);
}

//Inserta la asignación en la tabla de tokens

function tratarAtribuicao (tabelaTokens, arquivoLinhaAtual, linhaAtual, sentinela, lookAhead) {
	var idDelimitador;

	var valor = Object.keys(atribuicao).map(function(key){
    	idDelimitador = atribuicao[arquivoLinhaAtual[sentinela.value]];
	});
	
	inserirTabelaTokens(tabelaTokens, idDelimitador, linhaAtual, sentinela.value, -1);
	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;
	consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);
}

//Comprueba si es un char o una cadena
 //Concatenacion de comillas que cierran

 function tratarLiteral (tabelaTokens, tabelaLiterais, tabelaErrosLexicos, arquivoLinhaAtual, sentinela, lookAhead, linhaAtual) {
	var string = "";
	var retorno = new Array();
	var idLiteralCaracter;
	var descricaoErro;
	
	// char
	if (arquivoLinhaAtual[sentinela.value] == "'") {
		string = string.concat(arquivoLinhaAtual[lookAhead.value]);
		lookAhead.value = lookAhead.value + 1;
	
	// string
	} else {
		while ((arquivoLinhaAtual[lookAhead.value] != arquivoLinhaAtual[sentinela.value]) && 
		(lookAhead.value < arquivoLinhaAtual.length)) {
			string = string.concat(arquivoLinhaAtual[lookAhead.value]);
			lookAhead.value = lookAhead.value + 1;
		}
	}
	
	// Cierre de comillas 
	if (arquivoLinhaAtual[lookAhead.value] == arquivoLinhaAtual[sentinela.value]) {
		idLiteralCaracter = literais[arquivoLinhaAtual[sentinela.value]];
		var idLinha = inserirTabelaLiterais(tabelaLiterais, string, linhaAtual, sentinela.value);
		inserirTabelaTokens (tabelaTokens, idLiteralCaracter, linhaAtual, sentinela.value, idLinha); 	
		
		sentinela.value = lookAhead.value + 1;
		lookAhead.value = lookAhead.value + 2;
		consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);
	
	//Error de cierre de comillas
	} else {	
		if (arquivoLinhaAtual[sentinela.value] == "'"){
			descricaoErro = "Tem algo errado com esse char... Aspas sem fechar ou mais de um caracter?!";
			
			while (isLetter(arquivoLinhaAtual[lookAhead.value]) || isNumeric(arquivoLinhaAtual[lookAhead.value]) || arquivoLinhaAtual[lookAhead.value] == "'") {
				lookAhead.value = lookAhead.value + 1;
			}
		} else {
			descricaoErro = "Programador que é bom não esquece de fechar as aspas! #FicaADica";
			lookAhead.value = arquivoLinhaAtual.length;
		}
		
		inserirtabelaErros(tabelaErrosLexicos, descricaoErro, linhaAtual, sentinela.value);

		sentinela.value = lookAhead.value;
		lookAhead.value = lookAhead.value + 1;
	}
}


//Esto Inserta punto y coma en la tabla de tokens

function tratarSemicolon (tabelaTokens, arquivoLinhaAtual, linhaAtual, sentinela, lookAhead) {
	var idDelimitador;

	var valor = Object.keys(semicolon).map(function(key){
    	idDelimitador = semicolon[arquivoLinhaAtual];
	});

	inserirTabelaTokens(tabelaTokens, idDelimitador, linhaAtual, sentinela.value, -1);
	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;
	consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);
}

//Esto inserta un operador de token en la tabla de tokens
function tratarOperadores (tabelaTokens, linhaDoArquivo, sentinela, lookAhead, linhaAtual) {
	var operador = 	linhaDoArquivo[sentinela.value] + linhaDoArquivo[lookAhead.value];
	var idDelimitador;
	
    //Operador de dos caracteres
	if (operadores[operador] != undefined){
		idDelimitador = operadores[operador];
		lookAhead.value = lookAhead.value + 1;
	
	//Solo el primer caracter es un operador
	} else if (operadores[linhaDoArquivo[sentinela.value]] != undefined){
		idDelimitador = operadores[linhaDoArquivo[sentinela.value]];
	}
	
	inserirTabelaTokens(tabelaTokens, idDelimitador, linhaAtual, sentinela.value, -1);
	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;	
	consumirEspacos(linhaDoArquivo, sentinela, lookAhead);
}

