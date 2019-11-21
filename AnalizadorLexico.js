//Tablas para caracteres/Identificadores/Tokens/Constantes/Errores Lexicos y Sintacticos

var tablaCaracteres = 0;										
var TablaID = 0;								
var tablaTokens = 0;									
var tablaConstantes = 0;									
var tablaErroresLexicos = 0;								 	
var tablaErroresSintaticos = 0;								
var codigoCompilado = "";


//Contiene tokens aceptados por el analizador (identidficador=-1/ cosntante=-2)
var caracteres = {'"' : 29, "'" : 30};
var delimitadores = {"{" : 32, "}" : 33, "(" : 34, ")" : 35, ',' : 36, "." : 37};
var atributos = {"=" : 2};					
var comentario = {"//" : 1};					
var puntoycoma = {";" : 31};						
var operadores = {"==" : 3,">" : 4,"<" : 5,">=" : 6,"<=" : 7,"!=" : 8,"&&" : 9,"||" : 10, "!" : 11,"%" : 12,"+" : 13, "-" : 14,"/" : 15, "*" : 16,"^" : 17};
var palabrasReservadas = {"funcion" : 18, "princpipal" : 19, "retornar" : 20, "vacio" : 21, "variable" : 22, "entero" : 23, "decimal" : 24, "booleano" : 25, "cadena" : 26, "caracter" : 27, "si" : 28, "sino": 29,"mientras":30, "para":31, "hacer":32, "imprimir":33};


var lectorDeArchivo = new FileReader();
window.onload = function init() {
	lectorDeArchivo.onload = lerArchivo;
}        

//Leer un archivo Archivo como texto
function obtenerArchivo(archivoDeEntrada) {
     var arquivo = archivoDeEntrada.files[0];
     lectorDeArchivo.readAsText(arquivo);
}

//Muestra las filas del archivo en una tabla 
function lerArchivo(evento) {
	var archivo = evento.target.result.split('\n');
	var div = "<table border='0' cellpadding='0' cellspacing='0' class='centered'><td class='gutter' style='    padding-top: 6px!important; padding-left: 6px!important; color: rgb(100, 178, 134)!important;'>";

	for (var i = 0; i < archivo.length; i++) div = div + "<div class='line number3 index2 alt2' >"+i+"</div>";
	div = div + "</td><td><pre class='language-c'><code class='language-c'>";
	
	for (var i = 0; i < archivo.length; i++) {
		if (archivo[i] == '') codeLine = '\n';
		else codeLine = archivo[i];
		div += "<div class='codeLine' style='    text-align: left;'>"+ codeLine+'</div>';
	}

	div += "</code></pre></td></tr></table>";
	var archivoSalidaDiv = document.getElementById('arquivoSaida');
	archivoSalidaDiv.innerHTML = div;
	archivoSalidaDiv.classList.remove("ocultar-div");

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
	
	

	main(archivo);
}



//Esta parte verifica si un carácter es un número o no
function isLetter(str) {
	return str != undefined && str.match(/[a-z]/i) != null;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//Descarga 
function download_tablas() {
	var content = zip.generate({type:"blob"});
	saveAs(content, "tabelas.zip");
}

// esta parte lee espacios, separador o número para ser analizado como un token. 

function consumirEspacos(linhaDoArquivo, sentinela, lookAhead){
	var Observador2 = sentinela.value;
	
	
	 while ((Observador2 < linhaDoArquivo.length) && (linhaDoArquivo[Observador2] == " " || linhaDoArquivo[Observador2] == '\t')){
		 Observador2++;
	}
	
	
	if (Observador2 != sentinela.value){
		sentinela.value = Observador2;
		lookAhead.value = Observador2 + 1;
	

	} else if (linhaDoArquivo[Observador2] == undefined && Observador2+1 >= linhaDoArquivo.length){
		sentinela.value = Observador2 + 1;
		lookAhead.value = Observador2 + 2;
	}
}

//Aqui inserta el comentario en la tabla de tokens con su línea y columna en el código -1 ya que no hace referencia a otra tabla

function tratarComentario (tabelaTokens, lineadeArchivo, Observador, lookAhead, linhaAtual) {
	var idDelimitador = comentario["//"];
	
	inserirTabelaTokens(tabelaTokens, idDelimitador, linhaAtual, Observador.value, -1);
	lookAhead.value = lineadeArchivo.length;
	Observador.value = lookAhead.value;
}

//Inserta el delimitador en la tabla de tokens
function tratarDelimitadores (tabelaTokens, arquivoLinhaAtual, linhaAtual, sentinela, lookAhead) {
	var idDelimitador;

	var valor = Object.keys(delimitadores).map(function(key){
    	idDelimitador = delimitadores[arquivoLinhaAtual[sentinela.value]];
	});

	inserirTabelaTokens(tabelaTokens, idDelimitador, linhaAtual, sentinela.value, -1);
	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;
	consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);
}

//Inserta la asignación en la tabla de tokens
function tratarAtribuicao (tabelaTokens, arquivoLinhaAtual, linhaAtual, sentinela, lookAhead) {
	var idDelimitador;

	var valor = Object.keys(atributos).map(function(key){
    	idDelimitador = atributos[arquivoLinhaAtual[sentinela.value]];
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
	var descricaoError;
	

	if (arquivoLinhaAtual[sentinela.value] == "'") {
		string = string.concat(arquivoLinhaAtual[lookAhead.value]);
		lookAhead.value = lookAhead.value + 1;
	

	} else {
		while ((arquivoLinhaAtual[lookAhead.value] != arquivoLinhaAtual[sentinela.value]) && 
		(lookAhead.value < arquivoLinhaAtual.length)) {
			string = string.concat(arquivoLinhaAtual[lookAhead.value]);
			lookAhead.value = lookAhead.value + 1;
		}
	}
	
	// Cierre de comillas 
	if (arquivoLinhaAtual[lookAhead.value] == arquivoLinhaAtual[sentinela.value]) {
		idLiteralCaracter = caracteres[arquivoLinhaAtual[sentinela.value]];
		var idLinha = inserirTabelaLiterais(tabelaLiterais, string, linhaAtual, sentinela.value);
		inserirTabelaTokens (tabelaTokens, idLiteralCaracter, linhaAtual, sentinela.value, idLinha); 	
		
		sentinela.value = lookAhead.value + 1;
		lookAhead.value = lookAhead.value + 2;
		consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);
	
	//Error de cierre de comillas
	} else {	
		if (arquivoLinhaAtual[sentinela.value] == "'"){
			descricaoError = "";
			
			
			while (isLetter(arquivoLinhaAtual[lookAhead.value]) || isNumeric(arquivoLinhaAtual[lookAhead.value]) || arquivoLinhaAtual[lookAhead.value] == "'") {
				lookAhead.value = lookAhead.value + 1;
			}
		} else {
			descricaoError = "Cierre oracion";
			lookAhead.value = arquivoLinhaAtual.length;
		}
		
		inserirtabelaErros(tabelaErrosLexicos, descricaoError, linhaAtual, sentinela.value);

		sentinela.value = lookAhead.value;
		lookAhead.value = lookAhead.value + 1;
	}
}

//Esto Inserta punto y coma en la tabla de tokens
function tratarSemicolon (tabelaTokens, arquivoLinhaAtual, linhaAtual, sentinela, lookAhead) {
	var idDelimitador;

	var valor = Object.keys(puntoycoma).map(function(key){
    	idDelimitador = puntoycoma[arquivoLinhaAtual];
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

//Esta parte guarda el número en el token y la tabla constante
function tratarNumero (tabelaTokens, tabelaConstantes, tabelaErrosLexicos, arquivoLinhaAtual, sentinela, lookAhead, linhaAtual) {
	var numero = arquivoLinhaAtual[sentinela.value];
	var erro = false;
	
	while (lookAhead.value < arquivoLinhaAtual.length) {

		if (isNumeric(arquivoLinhaAtual[lookAhead.value]) || arquivoLinhaAtual[lookAhead.value] == ".") {
			numero = numero.concat(arquivoLinhaAtual[lookAhead.value]);
		
	// Separador u operador
		} else if (!isLetter(arquivoLinhaAtual[lookAhead.value])) {
			break;
		
		// Carácter literal y Error
		} else {
			
			var descricaoErro = "Cierre comillas o verifique letras y numeros";
			inserirtabelaErros (tabelaErrosLexicos, descricaoErro, linhaAtual, sentinela.value);
					
			erro = true;
			break;
		}	
		lookAhead.value = lookAhead.value + 1;
	}

	if (!erro) {
		numero = parseFloat(numero);
		var idLinha = inserirTabelaConstantes(tabelaConstantes, numero, linhaAtual, sentinela.value) ;
		inserirTabelaTokens (tabelaTokens, -2, linhaAtual, sentinela.value, idLinha) ; // id token -> constante = -2
		sentinela.value = lookAhead.value;
		lookAhead.value = lookAhead.value + 1;	
		consumirEspacos(arquivoLinhaAtual, sentinela, lookAhead);	
	} else {	
		while (lookAhead.value < arquivoLinhaAtual.length) {
			
			if (isNumeric(arquivoLinhaAtual[lookAhead.value]) || arquivoLinhaAtual[lookAhead.value] == 
			"." || isLetter(arquivoLinhaAtual[lookAhead.value])) {
				lookAhead.value++;
			
			//Separador u operador
			} else {
				break;
			}
		}
	
		sentinela.value = lookAhead.value;
		lookAhead.value = sentinela.value + 1;
	}
}


function verificarToken (tabelaTokens, tabelaIdentificadores, arquivoLinhaAtual, sentinela, lookAhead, linhaAtual){
	var palavra = arquivoLinhaAtual[sentinela.value];
	var erro = false;

	while (lookAhead.value < arquivoLinhaAtual.length) {

		
		if (isLetter(arquivoLinhaAtual[lookAhead.value]) ||
			isNumeric(arquivoLinhaAtual[lookAhead.value])|| 
			arquivoLinhaAtual[lookAhead.value] == "_") {
				
			palavra = palavra.concat(arquivoLinhaAtual[lookAhead.value]);
				
		
		} else {
			break;
		}
		
		lookAhead.value = lookAhead.value + 1;
	}
	

	if (palabrasReservadas[palavra] == undefined) {
		var idLinha = inserirTabelaIdentificadores (tabelaIdentificadores, palavra, linhaAtual, sentinela.value) ;
		inserirTabelaTokens (tabelaTokens, -1, linhaAtual, sentinela.value, idLinha) ;
	
	
	} else {
		var idToken = palabrasReservadas[palavra];
		inserirTabelaTokens (tabelaTokens, idToken, linhaAtual, sentinela.value, -1) ;
	}

	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;	
}

//la función inicializa tablas de códigos para el analizador léxico
function criarTabelas(tabelaIdentificadores, tabelaTokens, tabelaLiterais, tabelaConstantes, 
tabelaErrosLexicos) {
	var retorno = new Array();

	
	tabelaIdentificadores = new Array();
	
	
	tabelaTokens = new Array();

	
	tabelaLiterais = new Array();
	
	
	tabelaConstantes = new Array();
	
	
	tabelaErrosLexicos = new Array();
	
	
	tablaErroresSintaticos = new Array();
	
	retorno[0] = tabelaIdentificadores;
    retorno[1] = tabelaTokens;
    retorno[2] = tabelaLiterais;
    retorno[3] = tabelaConstantes;
    retorno[4] = tabelaErrosLexicos;
    retorno[5] = tablaErroresSintaticos;

	return retorno;
}

//inserta un nuevo token en la tabla única.
function inserirTabelaTokens(tabelaTokens, idToken, linhaCodigo, colunaCodigo, ponteiro){
	var idLinha = tabelaTokens.length;
	
	tabelaTokens[idLinha] = new Array();
	tabelaTokens[idLinha][0] = idLinha;
	tabelaTokens[idLinha][1] = idToken;
	tabelaTokens[idLinha][2] = linhaCodigo;
	tabelaTokens[idLinha][3] = colunaCodigo;
	tabelaTokens[idLinha][4] = ponteiro;
	
}

//inserta un nuevo token en la tabla de caracteres
function inserirTabelaLiterais(tabelaLiterais, literal, linhaCodigo, colunaCodigo) {
	var idLinha = tabelaLiterais.length;
	
	tabelaLiterais[idLinha] = new Array();
	tabelaLiterais[idLinha][0] = idLinha;
	tabelaLiterais[idLinha][1] = literal;
	tabelaLiterais[idLinha][2] = linhaCodigo;
	tabelaLiterais[idLinha][3] = colunaCodigo;

	return idLinha;
}

//inserta un nuevo token en la tabla de identificadores
function inserirTabelaIdentificadores(tabelaIdentificadores, nomeIdentificador, linhaCodigo, colunaCodigo) {
	var idLinha = tabelaIdentificadores.length;
	var variavel = false;
	var id;
	
	for (var i=0; i<idLinha; i++) {
		if (tabelaIdentificadores[i][1] == nomeIdentificador) {
			variavel = true;
			id = tabelaIdentificadores[i][0];
		}
	}
	
	if (variavel == false) {
		tabelaIdentificadores[idLinha] = new Array();
		tabelaIdentificadores[idLinha][0] = idLinha;
		tabelaIdentificadores[idLinha][1] = nomeIdentificador;
		tabelaIdentificadores[idLinha][2] = linhaCodigo;
		tabelaIdentificadores[idLinha][3] = colunaCodigo;
		//tabelaIdentificadores[idLinha][2] = fkTabelaConstantes;		
		return idLinha;
	} else {
		return id;
	}
	
}

//inserta un nuevo token en la tabla constante
function inserirTabelaConstantes(tabelaConstantes, constante, linhaCodigo, colunaCodigo) {
	var idLinha = tabelaConstantes.length;
	
	tabelaConstantes[idLinha] = new Array();
	tabelaConstantes[idLinha][0] = idLinha;
	tabelaConstantes[idLinha][1] = constante;
	tabelaConstantes[idLinha][2] = linhaCodigo;
	tabelaConstantes[idLinha][3] = colunaCodigo;	
	//tabelaConstantes[idLinha][2] = fkTabelaIndetificadores;		//Variável referente ao valors
	
	return idLinha;
}


//inserta el error en la tabla de errores
function inserirtabelaErros(tabelaErros, descricaoErro, linhaCodigo, colunaCodigo) {
	var idLinha = tabelaErros.length;
	
	tabelaErros[idLinha] = new Array();
	tabelaErros[idLinha][0] = idLinha;
	tabelaErros[idLinha][1] = descricaoErro;
	tabelaErros[idLinha][2] = linhaCodigo;
	tabelaErros[idLinha][3] = colunaCodigo;

	return idLinha;
}






function exibirTabelas(tabelaTokens, tabelaConstantes, tabelaLiterais, tabelaIdentificadores, 
tabelaErrosLexicos){
	var mensagem = "";
	var classe = "";
	var div = "<h5>Tabla de Tokens</h5>";
	div = div + "<table class='hoverable centered responsive-table table'><thead><tr><th>id</th><th>Codigo</th><th>Linea</th><th>Columna</th><th>Tabla</th></tr></thead><tbody>";
	
	if (tabelaTokens.length > 0) {
		for(var i = 0; i < tabelaTokens.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tabelaTokens[i][0] + "</td>");
			div = div.concat("<td>" + tabelaTokens[i][1] + "</td>");
			div = div.concat("<td>" + tabelaTokens[i][2] + "</td>");
			div = div.concat("<td>" + tabelaTokens[i][3] + "</td>");
			div = div.concat("<td>" + tabelaTokens[i][4] + "</td>");		
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";
		var divTabelaTokens = document.getElementById('tabelaToken');
		divTabelaTokens.innerHTML = div;
		divTabelaTokens.classList.remove("ocultar-div");
	}
	
	div = "<h5>Tabla de Constantes</h5>";
	div = div + "<table class='hoverable centered responsive-table table'><thead><tr><th>id</th><th>Constante</th><th>Linea</th><th>Columna</th></tr></thead><tbody>";
	
	if (tabelaConstantes.length > 0) {
		for(var i = 0; i < tabelaConstantes.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tabelaConstantes[i][0] + "</td>");
			div = div.concat("<td>" + tabelaConstantes[i][1] + "</td>");
			div = div.concat("<td>" + tabelaConstantes[i][2] + "</td>");
			div = div.concat("<td>" + tabelaConstantes[i][3] + "</td>");
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";
		var divTabelaConstantes = document.getElementById('tabelaConst');
		divTabelaConstantes.innerHTML = div;
		divTabelaConstantes.classList.remove("ocultar-div");
	}
	
	div = "<h5>Tabla de TextosPlanos</h5>";
	div = div + "<table class='hoverable centered responsive-table table'><thead><tr><th>id</th><th>Texto...</th><th>Linea</th><th>Columna</th></tr></thead><tbody>";
	
	if (tabelaLiterais.length > 0) {
		for(var i = 0; i < tabelaLiterais.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tabelaLiterais[i][0] + "</td>");
			div = div.concat("<td>" + tabelaLiterais[i][1] + "</td>");
			div = div.concat("<td>" + tabelaLiterais[i][2] + "</td>");
			div = div.concat("<td>" + tabelaLiterais[i][3] + "</td>");
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";
		var divTabelaLiterais = document.getElementById('tabelaLite');
		divTabelaLiterais.innerHTML = div;
		divTabelaLiterais.classList.remove("ocultar-div");
	}
	
	div = "<h5>Tabla de Identificadores</h5>";
	div = div + "<table class='hoverable centered responsive-table table'><thead><tr><th>id</th><th>Identificador</th><th>Linea</th><th>Columna</th></tr></thead><tbody>";
	
	if (tabelaIdentificadores.length > 0) {
		for(var i = 0; i < tabelaIdentificadores.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tabelaIdentificadores[i][0] + "</td>");
			div = div.concat("<td>" + tabelaIdentificadores[i][1] + "</td>");
			div = div.concat("<td>" + tabelaIdentificadores[i][2] + "</td>");
			div = div.concat("<td>" + tabelaIdentificadores[i][3] + "</td>");
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";
		var divTabelaIdentificadores = document.getElementById('tabelaVariaveis');
		divTabelaIdentificadores.innerHTML = div;	
		divTabelaIdentificadores.classList.remove("ocultar-div");		
	}
	
	
	div = "";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Error</th><th>Linea</th><th>Columna</th></tr></thead><tbody>";
	
	if (tabelaErrosLexicos.length > 0) {
		for(var i = 0; i < tabelaErrosLexicos.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tabelaErrosLexicos[i][0] + "</td>");
			div = div.concat("<td>" + tabelaErrosLexicos[i][1] + "</td>");
			div = div.concat("<td>" + tabelaErrosLexicos[i][2] + "</td>");
			div = div.concat("<td>" + tabelaErrosLexicos[i][3] + "</td>");
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";

		var divtabelaErrosLexicos = document.getElementById('tabelaErrosLexicos');
		divtabelaErrosLexicos.innerHTML = div;	
		divtabelaErrosLexicos.classList.remove("ocultar-div");	
		
		classe = "flash-fail";
	} else {
		div = "<p>Parabéns! Seu código não possui erros léxicos :)</p>";
		classe = "flash-success";	
		var divtabelaErrosLexicos = document.getElementById('tabelaErrosLexicos');
		divtabelaErrosLexicos.innerHTML = div;	
		divtabelaErrosLexicos.classList.remove("ocultar-div");
	}	

	var spanErrosLexico = document.getElementById('lexico-erros');
	spanErrosLexico.innerHTML = tabelaErrosLexicos.length;		
	spanErrosLexico.classList.add(classe);

	var results = document.getElementById('results-div')
	results.classList.remove("ocultar-div");				
}

function exibirErrosSintaticos(){
	var div = "";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Error</th><th>Linea</th><th>Columna</th></tr></thead><tbody>";
	if (tablaErroresSintaticos.length > 0){
		
		for(var i = 0; i < tablaErroresSintaticos.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tablaErroresSintaticos[i][0] + "</td>");
			div = div.concat("<td>" + tablaErroresSintaticos[i][1] + "</td>");
			div = div.concat("<td>" + tablaErroresSintaticos[i][2] + "</td>");
			div = div.concat("<td>" + tablaErroresSintaticos[i][3] + "</td>");
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";
		var divtabelaErrosSintatico = document.getElementById('tabelaErrosSintatico');
		divtabelaErrosSintatico.innerHTML = div;	
		divtabelaErrosSintatico.classList.remove("ocultar-div");	
		mensagem = "Tiene errores sintácticos ";	
		classe = "flash-fail";
		
	} else {
		div = "<p>Parabéns! Seu código não possui erros sintáticos :)</p>";
		classe = "flash-success";	
		var divtabelaErrosLexicos = document.getElementById('tabelaErrosSintatico');
		divtabelaErrosLexicos.innerHTML = div;	
		divtabelaErrosLexicos.classList.remove("ocultar-div");
	}		

	var spanErrosSintatico = document.getElementById('sintatico-erros');
	spanErrosSintatico.innerHTML = tablaErroresSintaticos.length;	
	spanErrosSintatico.classList.add(classe);
}


function exibirCodigoCompilado() {
	codigoCompilado = codigoCompilado.concat("</tr></table>");
	var divCodigoCompilado = document.getElementById('codigoCompilado');
	divCodigoCompilado.innerHTML = codigoCompilado;
	divCodigoCompilado.classList.remove("ocultar-div");
}


function criarCodigoCompilado(arquivo){
	codigoCompilado = codigoCompilado.concat("<table>");
	
	
	for(var i = 0; i < arquivo.length; i++) {
		codigoCompilado = codigoCompilado.concat("<tr id='linha-" + i + "'>");
		
		
		for (var j = 0; j < arquivo[i].length; j++) {
			codigoCompilado = codigoCompilado.concat("<td id='celula-" + i + "-" + j+ "'>" + 
			arquivo[i][j] + "</td>");
		}
		
		codigoCompilado = codigoCompilado.concat("</tr>");
	}
	codigoCompilado = codigoCompilado.concat("</table>");
	exibirCodigoCompilado();
}


function getNextToken(linha) {
	var token;
	linha.value++;
	
	if (linha.value < tablaTokens.length)
		token = tablaTokens[linha.value][1];
	else token = null;
	
	return token;
}


function declaration (token , linha, hasError) {
	 var coluna;
	token = getNextToken(linha); 
	
	 if (token == -1){
		token = getNextToken(linha);
		
		if (token != 31){		
			if (token != null) coluna = tablaTokens[linha.value][3];
			else coluna = tablaTokens[linha.value-1][3];
			
			if (token == 36) descricaoErro = " No se permiten declaraciones múltiples en una línea";
			else if (token == 2) descricaoErro = "Las asignaciones en la línea de declaración no están permitidas";
			else {
				linha.value--;
				coluna = coluna + 1;
				descricaoErro = "La declaración debe terminar con un punto y coma.";
			}
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);
			hasError.value = 1;
		}  		
	 } else {
		descricaoErro = "Después de un tipo debe ser un identificador.";
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
		hasError.value = 1;
	 }	 
}


function assignment_expression (token , linha, hasError) {
	 token = getNextToken(linha);
	 	 

	 if (token == 2){
		token = getNextToken(linha);
		assignment_expression_prime(token , linha, hasError);		
		
	 } else {
		descricaoErro = "Después de un identificador debe contener un signo de asignación.";
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
		hasError.value = 1;
	 }	 
}


function arithmetic_operation_prime (token , linha, hasError) {


	 if (token >= 12 && token <= 17){
		token = getNextToken(linha);
		
		
		if (token == -1 || token == -2){
			token = getNextToken(linha);			
			arithmetic_operation_prime (token , linha, hasError);
			
		} else {
			descricaoErro = "La operación aritmética debe tener un operando entre dos operadores.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
			hasError.value = 1;
		}
		
	
	 } else if (token != 31) {
			linha.value--;
			descricaoErro = "La tarea debe terminar con un punto y coma.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
			hasError.value = 1;
	 }
}


function assignment_expression_prime (token , linha, hasError) {
	 
	
	 if (token == 24){
		 read_statement (token , linha, hasError);
	

	} else if (token == 29 || token == 30){
		token = getNextToken(linha);
		
		if (token != 31){
			linha.value--;
			descricaoErro = "La tarea debe terminar con un punto y coma.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
			hasError.value = 1;
		}
		
	
	 } else if (token == -1 || token == -2) {
		token = getNextToken(linha);		
		arithmetic_operation_prime (token , linha, hasError);
	

	 } else {
			descricaoErro = "La asignación es incorrecta";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
			hasError.value = 1;
	 }
}



function print_statement (token , linha, hasError) {
	 token = getNextToken(linha);
	 	 
	 
	 if (token == 29 || token==30 || token==-1){
	 	token = getNextToken(linha);
		if (token != 31){
			linha.value--;
			coluna = tablaTokens[linha.value][3] + 1;
			descricaoErro = "La declaración debe terminar con un punto y coma.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);
			hasError.value = 1;
		} 		
	} else {
		if (token == 34) descricaoErro = "La cadena no está permitida entre paréntesis.";
		else descricaoErro = "Declaración incorrecta... La declaración debe ser de tipo print literal ";

		if (token != null) 
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
		else {
			linha.value--
			coluna = tablaTokens[linha.value][3] + 1;
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);
			linha.value++
		}
		hasError.value = 1;
	 }	 
}


function read_statement (token , linha, hasError) {	 
	 token = getNextToken(linha);
	 	 
	 if (token == 34){	
	 	token = getNextToken(linha);
		if (token == 35){ 
			token = getNextToken(linha);
			if (token != 31) {
				linha.value--;
				coluna = tablaTokens[linha.value][3] + 1;
				descricaoErro = "La declaración debe terminar con un punto y coma.";
				inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);
				hasError.value = 1;
			}
		} else {
			linha.value--;
			coluna = tablaTokens[linha.value][3] + 1;
			descricaoErro = '¡Declaración incorrecta! La declaración debe ser de tipo read ()';
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);
			hasError.value = 1;
		}	
	} else {
		descricaoErro = '¡Declaración incorrecta! La declaración debe ser de tipo read ()';
		if (token != null) 
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
		else {
			linha.value--
			coluna = tablaTokens[linha.value][3] + 1;
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);
			linha.value++
		}
		hasError.value = 1;
	 }	 
}


function expression (token, linha, hasError) {
	if (token == -1 || token == -2){	
		token = getNextToken(linha);		
		if (token >= 3 && token <= 10)	{	
			token = getNextToken(linha);
			if (token != -1 && token != -2) {	
				descricaoErro = "La comparación solo se puede hacer con constante y / o identificador.";
				inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
				hasError.value = 1;
			}
		} else if (token == 11) {	
			token = getNextToken(linha);
			if (token != -1) {	
				descricaoErro = "La negación debe hacerse de la siguiente manera: Identificador.";
				inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
				hasError.value = 1;
			} 
		} else {
			descricaoErro = "La negación debe hacerse de la siguiente manera: Identificador.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
			hasError.value = 1;
		}
	} else if (token == 11) {	
		token = getNextToken(linha);
		if (token != -1) {	
			descricaoErro = "La negación debe hacerse de la siguiente manera: Identificador.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
			hasError.value = 1;
		}
	} else {
		descricaoErro = "Expresion invalida";
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
		hasError.value = 1;
	}
}


function code_snippet (token, linha, hasError) {
	var linhaAnterior = linha.value;								
	while (token != 33 && token != null) {						
	
		if (token == 20 || token == 21){						
			if (token != 31) {
				linha.value--
				coluna = tablaTokens[linha.value][3] + 1;
				descricaoErro = "Debe haber un punto y coma después de la declaración";
				inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], coluna);	
				linha.value++
				hasError.value = 1;
			}
		} else 	{
			statement(token, linha);
		}
		token = getNextToken(linha);
	}	
	
	if (token != 33){
		linha.value = linhaAnterior-1;
		descricaoErro = "Debe haber una tecla de cierre después de un bloque de código";
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);	
		linha.value = tablaTokens.length;
	} else {
		linha.value = linha.value -1;
	}
}


function while_statement (token , linea, hasError) {
	 token = getNextToken(linea);

	 if (token == 34) {	
	 	token = getNextToken(linea);
	 	expression(token , linea, hasError);
	 	token = getNextToken(linea);
	 	if (token == 35) {		
	 		token = getNextToken(linea);
	 		if (token == 32){	
	 			token = getNextToken(linea);
	 			code_snippet(token , linea, hasError);	
	 			token = getNextToken(linea);
			} else {
				descricaoErro = " Después de la expresión, debe abrir la clave.";
				inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linea.value][2], tablaTokens[linea.value][3]);
				hasError.value = 1;
	 		}
	 	} else {
			descricaoErro = "Debe cerrar los paréntesis después de una expresión";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linea.value][2], tablaTokens[linea.value][3]);
			hasError.value = 1;
 		}

	 } else {
		descricaoErro = 'La declaración debe tener un paréntesis abierto';
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linea.value][2], tablaTokens[linea.value][3]);
		hasError.value = 1;
	}
}


function if_statement_linha (token , linha, hasError) {
	if (token == 32){	
		token = getNextToken(linha);
		code_snippet(token , linha, hasError);	
		token = getNextToken(linha);
	} else {
		descricaoErro = "Después de la expresión, debe abrir la clave";
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linha.value][2], tablaTokens[linha.value][3]);
		hasError.value = 1;
	}
}



function if_statement (token , linea, hasError) {
	token = getNextToken(linea);

	if (token == 34) {	
	 	token = getNextToken(linea);
	 	expression(token , linea, hasError);
	 	token = getNextToken(linea);
	 	if (token == 35) {		
	 		token = getNextToken(linea);
	 		if (token == 32){	
	 			token = getNextToken(linea);
	 			code_snippet(token , linea, hasError);	
	 			token = getNextToken(linea);
			 	if (token == 19) {
					token = getNextToken(linea);
					if (token == 18){		
						if_statement (token , linea, hasError);
					} else {
						 if_statement_linha (token , linea, hasError) 
					}
	 			} 
	 		} else {
				descricaoErro = "Después de la expresión, debe abrir la clave.";
				inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linea.value][2], tablaTokens[linea.value][3]);
				hasError.value = 1;
	 		}
	 	} else {
			descricaoErro = "Debe cerrar los paréntesis después de una expresión.";
			inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linea.value][2], tablaTokens[linea.value][3]);
			hasError.value = 1;
 		}
	 } else {
		descricaoErro = 'La declaración debe tener un paréntesis abierto';
		inserirtabelaErros(tablaErroresSintaticos, descricaoErro, tablaTokens[linea.value][2], tablaTokens[linea.value][3]);
		hasError.value = 1;
	}
}



function statement (token, linha) {
	 var hasError = {value: 0};

	 
	 if (token >= 25 && token <= 28){
		declaration(token , linha, hasError);
		 
	
	 } else if (token == -1) {
		assignment_expression(token , linha, hasError);
	 
	 } else if (token == 22) {
		 while_statement(token , linha, hasError);
		 
	
	 } else if (token == 23) {

		 print_statement(token , linha, hasError);
		 
	
	 } else if (token == 24) {
		 read_statement(token , linha, hasError);
		 
	 
	 } else if (token == 18) {
		if_statement(token , linha, hasError);
		 
	 }
	 
	 
	 if (hasError.value == 1){
		 while ((linha.value < tablaTokens.length) && (tablaTokens[linha.value][3] != 0)) {
				linha.value++;
				
		 }
		 linha.value--;
	 }
}



function sintatico () {
	var linha = {value: 0};	
	var token;

	while (linha.value < tablaTokens.length) {
		token = tablaTokens[linha.value][1];
		statement(token, linha);		
		linha.value++;			
	}
	 exibirErrosSintaticos();
}


function main (arquivo) {
	
	var linhasArquivo = arquivo.length;							
	var sentinela = {value: 0};									
	var lookAhead = {value: 1};								
	var flag; 													
	var retorno;												
	
	
	retorno = criarTabelas(TablaID, tablaTokens, tablaCaracteres, tablaConstantes, 
	tablaErroresLexicos);

	TablaID = retorno[0];
    tablaTokens = retorno[1];
    tablaCaracteres = retorno[2];
    tablaConstantes = retorno[3];
    tablaErroresLexicos = retorno[4];
    tablaErroresSintaticos = retorno[5];
    

	
	for (var linhaAtual = 0; linhaAtual < linhasArquivo; linhaAtual++) {

		sentinela.value = 0;
		lookAhead.value = 1;
	
		
		while (sentinela.value < arquivo[linhaAtual].length) {
										
				if (arquivo[linhaAtual][sentinela.value] == " " || 
					arquivo[linhaAtual][sentinela.value] == '\t'|| 
					arquivo[linhaAtual][sentinela.value] == '\n') {
						
					consumirEspacos(arquivo[linhaAtual], sentinela, lookAhead);
				}
				
				if (arquivo[linhaAtual][sentinela.value] != undefined) { 
					
					if (delimitadores[arquivo[linhaAtual][sentinela.value]] != undefined) {
						
						tratarDelimitadores(tablaTokens, arquivo[linhaAtual], linhaAtual, sentinela, lookAhead);
						
					} else if (((operadores[arquivo[linhaAtual][sentinela.value]] != undefined) || 
								(operadores[arquivo[linhaAtual][sentinela.value]+arquivo[linhaAtual][lookAhead.value]] != undefined)) && !(arquivo[linhaAtual][sentinela.value] == "/" &&  arquivo[linhaAtual][lookAhead.value] == "/")) {
						
						tratarOperadores (tablaTokens, arquivo[linhaAtual], sentinela, lookAhead, linhaAtual);
						
					} else if (atributos[arquivo[linhaAtual][sentinela.value]] != undefined) {
						
						tratarAtribuicao (tablaTokens, arquivo[linhaAtual], linhaAtual, sentinela, lookAhead);
						
					} else 	if (puntoycoma[arquivo[linhaAtual][sentinela.value]] != undefined) {
						
						tratarSemicolon (tablaTokens, arquivo[linhaAtual][sentinela.value], linhaAtual, sentinela, lookAhead);	
						
					} else if (caracteres[arquivo[linhaAtual][sentinela.value]] != undefined) {
						
						tratarLiteral (tablaTokens, tablaCaracteres, tablaErroresLexicos, arquivo[linhaAtual], sentinela, lookAhead, linhaAtual);
						
					} else if (arquivo[linhaAtual][sentinela.value] == "/" && 
							   arquivo[linhaAtual][lookAhead.value] == "/" ) {
								   
						tratarComentario(tablaTokens, arquivo[linhaAtual], sentinela, lookAhead, linhaAtual);
						
					} else if (isNumeric(arquivo[linhaAtual][sentinela.value]))  {
						
						tratarNumero (tablaTokens, tablaConstantes, tablaErroresLexicos, arquivo[linhaAtual], sentinela, lookAhead, linhaAtual);
						
					} else if (isLetter(arquivo[linhaAtual][sentinela.value])){
						
						verificarToken(tablaTokens, TablaID, arquivo[linhaAtual], sentinela, lookAhead, 
						linhaAtual);		

					} else {			
						var descricaoErro = "Error...Corrija o Elimine";
						inserirtabelaErros (tablaErroresLexicos, descricaoErro, linhaAtual, sentinela.value);
						sentinela.value = arquivo[linhaAtual].length + 1;
					}
				
			} else {
				sentinela.value = arquivo[linhaAtual].length + 1;
			}
		}
	}

	var divDownload = document.getElementById('boton-download-div');
		

	sintatico ();
	
	exibirTabelas(tablaTokens, tablaConstantes, tablaCaracteres, TablaID,tablaErroresLexicos);
//	gerarArquivoTexto(tabelaTokens, tabelaConstantes, tabelaLiterais, tabelaErrosLexicos, tabelaIdentificadores, tabelaErrosSintaticos);

}
