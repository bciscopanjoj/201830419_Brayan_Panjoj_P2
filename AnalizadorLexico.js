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
			
			var descricaoErro = "Número inválido! Você acha que número e letra é a mesma coisa!?";
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
			
		
// Separador u operador

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

		//Apenas letras, com números ou com underscore
		if (isLetter(arquivoLinhaAtual[lookAhead.value]) ||
			isNumeric(arquivoLinhaAtual[lookAhead.value])|| 
			arquivoLinhaAtual[lookAhead.value] == "_") {
				
			palavra = palavra.concat(arquivoLinhaAtual[lookAhead.value]);
				
		//Separador encontrado
		} else {
			break;
		}
		
		lookAhead.value = lookAhead.value + 1;
	}
	
	//Variável
	if (palavrasReservadas[palavra] == undefined) {
		var idLinha = inserirTabelaIdentificadores (tabelaIdentificadores, palavra, linhaAtual, sentinela.value) ;
		inserirTabelaTokens (tabelaTokens, -1, linhaAtual, sentinela.value, idLinha) ;
	
	//Palavra reservada
	} else {
		var idToken = palavrasReservadas[palavra];
		inserirTabelaTokens (tabelaTokens, idToken, linhaAtual, sentinela.value, -1) ;
	}

	sentinela.value = lookAhead.value;
	lookAhead.value = lookAhead.value + 1;	
}

//la función inicializa tablas de códigos para el analizador léxico.
function criarTabelas(tabelaIdentificadores, tabelaTokens, tabelaLiterais, tabelaConstantes, 
tabelaErrosLexicos) {
	var retorno = new Array();

	
	tabelaIdentificadores = new Array();
	
	tabelaTokens = new Array();

	tabelaLiterais = new Array();
	
	tabelaConstantes = new Array();

	tabelaErrosLexicos = new Array();
	
	tabelaErrosSintaticos = new Array();
	
	retorno[0] = tabelaIdentificadores;
    retorno[1] = tabelaTokens;
    retorno[2] = tabelaLiterais;
    retorno[3] = tabelaConstantes;
    retorno[4] = tabelaErrosLexicos;
    retorno[5] = tabelaErrosSintaticos;

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


//genera el archivo de texto de la tabla
function gerarArquivoTexto(tabelaTokens, tabelaConstantes, tabelaLiterais, tabelaErrosLexicos, tabelaIdentificadores, tabelaErrosSintaticos) {
	var arquivoTokens = "";
	var arquivoLiterais = "";
	var arquivoConstantes = "";
	var arquivoIdentificadores = "";
	var arquivoErros = "";
	var arquivoErrosSintaticos = "";
	
	if (tabelaErrosLexicos.length > 0) {
		for(var i = 0; i < tabelaErrosLexicos.length; i++) {
			arquivoErros = arquivoErros.concat(tabelaErrosLexicos[i][0] + " ");
			arquivoErros = arquivoErros.concat(tabelaErrosLexicos[i][1] + " ");
			arquivoErros = arquivoErros.concat(tabelaErrosLexicos[i][2] + " ");
			arquivoErros = arquivoErros.concat(tabelaErrosLexicos[i][3] + "\n");
		}
		zip.file("arquivoErrosLexicos.txt", arquivoErros);
	} 

	if (tabelaErrosSintaticos.length > 0) {
		for(var i = 0; i < tabelaErrosSintaticos.length; i++) {
			arquivoErrosSintaticos = arquivoErrosSintaticos.concat(tabelaErrosSintaticos[i][0] + " ");
			arquivoErrosSintaticos = arquivoErrosSintaticos.concat(tabelaErrosSintaticos[i][1] + " ");
			arquivoErrosSintaticos = arquivoErrosSintaticos.concat(tabelaErrosSintaticos[i][2] + " ");
			arquivoErrosSintaticos = arquivoErrosSintaticos.concat(tabelaErrosSintaticos[i][3] + "\n");
		}
		zip.file("arquivoErrosSintaticos.txt", arquivoErrosSintaticos);
	} 

	if (tabelaErrosLexicos.length == 0) {
	
		if (tabelaTokens.length > 0) {
			for(var i = 0; i < tabelaTokens.length; i++) {
				arquivoTokens = arquivoTokens.concat(tabelaTokens[i][0] + " ");
				arquivoTokens = arquivoTokens.concat(tabelaTokens[i][1] + " ");
				arquivoTokens = arquivoTokens.concat(tabelaTokens[i][2] + " ");
				arquivoTokens = arquivoTokens.concat(tabelaTokens[i][3] + " ");
				arquivoTokens = arquivoTokens.concat(tabelaTokens[i][4] + "\n");		
			}	
			
			zip.file("arquivoTokens.txt", arquivoTokens);
		}
		
		if (tabelaLiterais.length > 0) {
			for(var i = 0; i < tabelaLiterais.length; i++) {
				arquivoLiterais = arquivoLiterais.concat(tabelaLiterais[i][0] + " ");
				arquivoLiterais = arquivoLiterais.concat(tabelaLiterais[i][1] + " ");
				arquivoLiterais = arquivoLiterais.concat(tabelaLiterais[i][2] + " ");
				arquivoLiterais = arquivoLiterais.concat(tabelaLiterais[i][3] + "\n");
			}	
			zip.file("arquivoLiterais.txt", arquivoLiterais);
		}
		
		if (tabelaConstantes.length > 0) {
			for(var i = 0; i < tabelaConstantes.length; i++) {
				arquivoConstantes = arquivoConstantes.concat(tabelaConstantes[i][0] + " ");
				arquivoConstantes = arquivoConstantes.concat(tabelaConstantes[i][1] + " ");
				arquivoConstantes = arquivoConstantes.concat(tabelaConstantes[i][2] + " ");
				arquivoConstantes = arquivoConstantes.concat(tabelaConstantes[i][3] + "\n");
			}	
			zip.file("arquivoConstantes.txt", arquivoConstantes);
		}	
		
		if (tabelaIdentificadores.length > 0) {
			for(var i = 0; i < tabelaIdentificadores.length; i++) {
				arquivoIdentificadores = arquivoIdentificadores.concat(tabelaIdentificadores[i][0] + " ");
				arquivoIdentificadores = arquivoIdentificadores.concat(tabelaIdentificadores[i][1] + " ");
				arquivoIdentificadores = arquivoIdentificadores.concat(tabelaIdentificadores[i][2] + " ");
				arquivoIdentificadores = arquivoIdentificadores.concat(tabelaIdentificadores[i][3] + "\n");
			}	
			zip.file("arquivoIdentificadores.txt", arquivoIdentificadores);
		}	
	}
}

function exibirTabelas(tabelaTokens, tabelaConstantes, tabelaLiterais, tabelaIdentificadores, 
tabelaErrosLexicos){
	var mensagem = "";
	var classe = "";
	var div = "<h5>Tabela de Tokens</h5>";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Codigo</th><th>Linha</th><th>Coluna</th><th>id Tabela</th></tr></thead><tbody>";
	
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
	
	div = "<h5>Tabela de Constantes</h5>";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Constante</th><th>Linha</th><th>Coluna</th></tr></thead><tbody>";
	
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
	
	div = "<h5>Tabela de Literais</h5>";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Literal</th><th>Linha</th><th>Coluna</th></tr></thead><tbody>";
	
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
	
	div = "<h5>Tabela de Identificadores</h5>";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Identificador</th><th>Linha</th><th>Coluna</th></tr></thead><tbody>";
	
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
	
	//div = "<h5>Tabela de Erros Léxicos</h5>";
	div = "";
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Erro</th><th>Linha</th><th>Coluna</th></tr></thead><tbody>";
	
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
	div = div + "<table class='hoverable centered responsive-table'><thead><tr><th>id</th><th>Erro</th><th>Linha</th><th>Coluna</th></tr></thead><tbody>";
	if (tabelaErrosSintaticos.length > 0){
		
		for(var i = 0; i < tabelaErrosSintaticos.length; i++) {
			div = div.concat("<tr class='line-hover'>");
			div = div.concat("<td>" + tabelaErrosSintaticos[i][0] + "</td>");
			div = div.concat("<td>" + tabelaErrosSintaticos[i][1] + "</td>");
			div = div.concat("<td>" + tabelaErrosSintaticos[i][2] + "</td>");
			div = div.concat("<td>" + tabelaErrosSintaticos[i][3] + "</td>");
			div = div.concat("</tr>");
		}	
		div = div + "</tbody></table>";
		var divtabelaErrosSintatico = document.getElementById('tabelaErrosSintatico');
		divtabelaErrosSintatico.innerHTML = div;	
		divtabelaErrosSintatico.classList.remove("ocultar-div");	
		mensagem = "Ohhh! Seu código possui erros sintáticos :(";	
		classe = "flash-fail";
		
	} else {
		div = "<p>Parabéns! Seu código não possui erros sintáticos :)</p>";
		classe = "flash-success";	
		var divtabelaErrosLexicos = document.getElementById('tabelaErrosSintatico');
		divtabelaErrosLexicos.innerHTML = div;	
		divtabelaErrosLexicos.classList.remove("ocultar-div");
	}		

	var spanErrosSintatico = document.getElementById('sintatico-erros');
	spanErrosSintatico.innerHTML = tabelaErrosSintaticos.length;	
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
	

// Líneas de archivo
	for(var i = 0; i < arquivo.length; i++) {
		codigoCompilado = codigoCompilado.concat("<tr id='linha-" + i + "'>");
		
		
// Columnas de archivo
		for (var j = 0; j < arquivo[i].length; j++) {
			codigoCompilado = codigoCompilado.concat("<td id='celula-" + i + "-" + j+ "'>" + 
			arquivo[i][j] + "</td>");
		}
		
		codigoCompilado = codigoCompilado.concat("</tr>");
	}
	codigoCompilado = codigoCompilado.concat("</table>");
	exibirCodigoCompilado();
}

//las funciones de tokens
function getNextToken(linha) {
	var token;
	linha.value++;
	
	if (linha.value < tabelaTokens.length)
		token = tabelaTokens[linha.value][1];
	else token = null;
	
	return token;
}


//maneja la declaración de 

function declaration (token , linha, hasError) {
	var coluna;
   token = getNextToken(linha); 
	

	if (token == -1){
	   token = getNextToken(linha);
	   
	   if (token != 31){		
		   if (token != null) coluna = tabelaTokens[linha.value][3];
		   else coluna = tabelaTokens[linha.value-1][3];
		   
		   if (token == 36) descricaoErro = "Não é permitido declarações múltiplas em uma linha.";
		   else if (token == 2) descricaoErro = "Não é permitido atribuições na linha de declaração.";
		   else {
			   linha.value--;
			   coluna = coluna + 1;
			   descricaoErro = "A declaração deve finalizar com um ponto e vírgula.";
		   }
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);
		   hasError.value = 1;
	   }  		
	} else {
	   descricaoErro = "Declaração incorreta! Depois de um tipo deve ser um identificador.";
	   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
	   hasError.value = 1;
	}	 
}


function assignment_expression (token , linha, hasError) {
	token = getNextToken(linha);
		 

	if (token == 2){
	   token = getNextToken(linha);
	   assignment_expression_prime(token , linha, hasError);		
	   
	} else {
	   descricaoErro = "Atribuição incorreta! Depois de um identificador deve conter um sinal de atribuição.";
	   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
	   hasError.value = 1;
	}	 
}


function arithmetic_operation_prime (token , linha, hasError) {

	//Operadores aritméticos
	if (token >= 12 && token <= 17){
	   token = getNextToken(linha);
	   
	   //Identificador o constante
	   if (token == -1 || token == -2){
		   token = getNextToken(linha);			
		   arithmetic_operation_prime (token , linha, hasError);
		   
	   } else {
		   descricaoErro = "Operação aritmética deve ter um operando entre dois operadores.";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
		   hasError.value = 1;
	   }
	   
   // ERROR: debe ser punto y coma
	} else if (token != 31) {
		   linha.value--;
		   descricaoErro = "A atribuição deve finalizar com um ponto e vírgula.";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
		   hasError.value = 1;
	}
}


function assignment_expression_prime (token , linha, hasError) {
	
	
//  lenguaje
	if (token == 24){
		read_statement (token , linha, hasError);
   
   
   } else if (token == 29 || token == 30){
	   token = getNextToken(linha);
	   
	   if (token != 31){
		   linha.value--;
		   descricaoErro = "A atribuição deve finalizar com um ponto e vírgula.";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
		   hasError.value = 1;
	   }
	   
   //Identificador o constante
	} else if (token == -1 || token == -2) {
	   token = getNextToken(linha);		
	   arithmetic_operation_prime (token , linha, hasError);
   
   
	} else {
		   descricaoErro = "A atribuição está incorreta!";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
		   hasError.value = 1;
	}
}


function print_statement (token , linha, hasError) {
	token = getNextToken(linha);
		 

// Veo si es un literal o un caracter o un identificador
	if (token == 29 || token==30 || token==-1){
		token = getNextToken(linha);
	   if (token != 31){
		   linha.value--;
		   coluna = tabelaTokens[linha.value][3] + 1;
		   descricaoErro = "A declaração deve finalizar com ponto e vírgula.";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);
		   hasError.value = 1;
	   } 		
   } else {
	   if (token == 34) descricaoErro = "Não é permitido string entre parênteses.";
	   else descricaoErro = "Declaração incorreta! A declaração deve ser do tipo print literal ";

	   if (token != null) 
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
	   else {
		   linha.value--
		   coluna = tabelaTokens[linha.value][3] + 1;
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);
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
			   coluna = tabelaTokens[linha.value][3] + 1;
			   descricaoErro = "A declaração deve finalizar com ponto e vírgula.";
			   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);
			   hasError.value = 1;
		   }
	   } else {
		   linha.value--;
		   coluna = tabelaTokens[linha.value][3] + 1;
		   descricaoErro = 'Declaração incorreta! A declaração deve ser do tipo read ()';
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);
		   hasError.value = 1;
	   }	
   } else {
	   descricaoErro = 'Declaração incorreta! A declaração deve ser do tipo read ()';
	   if (token != null) 
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
	   else {
		   linha.value--
		   coluna = tabelaTokens[linha.value][3] + 1;
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);
		   linha.value++
	   }
	   hasError.value = 1;
	}	 
}

//verifica si es una expresión de comparación o una expresión lógica entre un identificador y / o una constante.

function expression (token, linha, hasError) {
   if (token == -1 || token == -2){	
	   token = getNextToken(linha);		
	   if (token >= 3 && token <= 10)	{	
		   token = getNextToken(linha);
		   if (token != -1 && token != -2) {	
			   descricaoErro = "Comparação só pode ser feita com constante e/ou identificador.";
			   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
			   hasError.value = 1;
		   }
	   } else if (token == 11) {	
		   token = getNextToken(linha);
		   if (token != -1) {	
			   descricaoErro = "A negacao deve ser feita da seguinte forma: !identificador.";
			   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
			   hasError.value = 1;
		   } 
	   } else {
		   descricaoErro = "A negacao deve ser feita da seguinte forma: !identificador.";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
		   hasError.value = 1;
	   }
   } else if (token == 11) {	
	   token = getNextToken(linha);
	   if (token != -1) {	
		   descricaoErro = "A negacao deve ser feita da seguinte forma: !identificador.";
		   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
		   hasError.value = 1;
	   }
   } else {
	   descricaoErro = "Expressão inválida.";
	   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);
	   hasError.value = 1;
   }
}
//Función que trata el fragmento de código dentro si y solo si maneja

function code_snippet (token, linha, hasError) {
   var linhaAnterior = linha.value;								
   while (token != 33 && token != null) {						
   
	   if (token == 20 || token == 21){						
		   token = getNextToken(linha);
		   if (token != 31) {
			   linha.value--
			   coluna = tabelaTokens[linha.value][3] + 1;
			   descricaoErro = "Deve haver um ponto e virgula depois do statement";
			   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], coluna);	
			   linha.value++
			   hasError.value = 1;
		   }
	   } else 	{
		   statement(token, linha);  //chkhlkhkljh
	   }
	   token = getNextToken(linha);
   }	
   
   if (token != 33){
	   linha.value = linhaAnterior-1;
	   descricaoErro = "Deve haver um fecha chave depois de um bloco de código.";
	   inserirtabelaErros(tabelaErrosSintaticos, descricaoErro, tabelaTokens[linha.value][2], tabelaTokens[linha.value][3]);	
	   linha.value = tabelaTokens.length;
   } else {
	   linha.value = linha.value -1;
   }
}





 




