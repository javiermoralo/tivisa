/*-----------------------------------------------------------------------------
Tivissa es un chatbot de primera generación, es decir, que no tiene impletanda una
capa cognitiva. Está pensado para ayudar al usuario a organizar sus actividades de
senderismo, ciclismo y mountain-bike, apoyándose en la web "wikiloc".

La primera beta se termino el 23 de diciembre de 2016
-----------------------------------------------------------------------------*/
 
 //Revisión de módulos y parámetros necesarios

var restify = require('restify');
var builder = require('botbuilder');

var appId = process.env.MICROSOFT_APP_ID;
var appPassword = process.env.MICROSOFT_APP_PASSWORD;

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function ()
{
   console.log('%s listening to %s', server.name, server.url); 
});
 
// Create chat bot
var connector = new builder.ChatConnector(
{
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());



//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Acciones Globales
//=========================================================

bot.beginDialogAction('Salir', '/despedida', { matches: /^Salir/i });
bot.beginDialogAction('Ayuda', '/ayuda', { matches: /^Ayuda/i });
bot.beginDialogAction('Actividades', '/actividades', { matches: /^Actividades/i });

//=========================================================
// Diálogos del Bot
//=========================================================

bot.dialog('/',
[
    function (session)
    {
        // Saludo y presentación.
        session.beginDialog('/presentacion');
    },
    
    function (session)
    {
        //Mostrar ayuda
        session.beginDialog('/ayuda');
    },

    function (session)
    {
        // Mostrar actividades
        session.beginDialog('/actividades');
    }

]);

/*Diálogo de presentación, no se finaliza hasta que el usuario elija alguna de las opciones disponibles.
De esta forma, se evita que el bot tenga que gestionar preguntas que no vienen al caso*/

bot.dialog('/presentacion',
[
    function (session)
    {
        if (!session.userData.name)
        {
            session.send("Hola... Me llamo Tivissa, un adventure bot, y puedo ayudarte a organizar tus actividades en la naturaleza.");
            session.replaceDialog('/perfil');

        }
        else
        {
            session.beginDialog('/ayuda');
        }
    }
]);

//Diálogo para pedir el nombre al usuario y almacenarlo.
bot.dialog('/perfil',
[
	function (session) 
	{
			builder.Prompts.text(session, '¿Cúal es tu nombre?, sólo tú nombre. Gracias! :)');
	},
		
	function (session, results)
	{
		session.userData.name = results.response;
		session.endDialog();
	}
]);

//Diálogo de ayuda.
bot.dialog('/ayuda',
[
    function (session)
    {
        session.send("Hola " + session.userData.name + "!");
        session.send("Tienes a tú disposición los siguientes comandos (puedes usarlos cuando quieras):\n\n* Actividades - Ir al menú de actividades.\n* Salir - Finalizar la conversación.\n* Ayuda - Ver esta ayuda.");
        //session.endDialog("En todo momento tendrás a tú disposición los siguientes comandos:\n\n* Actividades - Para ir al menú de actividades.\n* Adiós - Finalizar la conversación.\n* Ayuda - Ver esta ayuda.");
    }
]);

//Diálogo de despedida.
bot.dialog('/despedida',
[
    function (session)
    {
        session.endConversation("Hasta luego, "+ session.userData.name + "! :)");
    }
]);

//Diálogo de actividades.
bot.dialog('/actividades',
[
    function (session, results)
	{
        builder.Prompts.choice(session, "Bien " + session.userData.name + ", ¿Qué tipo de actividad quieres hacer?", "senderismo|cicloturismo|mountain-bike|(salir)");
    },

    function (session, results)
    {
        if (results.response && results.response.entity != '(salir)')
        {
            // Lanza el diálogo correspondiente a la actividad seleccionada.
            session.beginDialog('/' + results.response.entity);
        }
        else
        {
            // Sale del menú de Actividades y cierra la cnversación.
            session.beginDialog('/despedida');
        }
    },

    function (session, results)
    {
        // El menú se ejecuta recusivamente hasta que el usuario elija un opción o lo quite.
        session.replaceDialog('/actividades');
    }
]).reloadAction('reloadMenu', null, { matches: /^Actividades/i });

//Gestión y construcción de los resultados de senderismo.
bot.dialog('/senderismo',
[
    //Se llama al diálogo de "preguntas" para recopilar los datos.
    function (session)
    {
        session.beginDialog('/preguntas');
    },
    
    //Se contruye una HeroCard, con una imagen y un botón que activa la url donde se recogen los parámetros recogidos en el diálogo de " preguntas".
    function (session, results)
    {
        msg = new builder.Message(session)
            .attachments
            ([
                //new builder.ThumbnailCard(session)
                new builder.HeroCard(session)
                    .text("Genial, " + session.userData.name + "!. ¿Listo para calzarte las botas?")
                    .images
                    ([
                        builder.CardImage.create(session, "https://openclipart.org/image/160px/svg_to_png/250919/groddle-scene-pine-trees-mountains.png")
                    ])
                    .buttons([builder.CardAction.openUrl(session, "http://es.wikiloc.com/rutas/senderismo?q="+ session.userData.locality + "&t=" + session.userData.type + "&d=" + session.userData.difficulty + "&" + session.userData.distance + "&src=" + session.userData.origin, "Vamos a ello!")])
            ]);
        session.endConversation(msg);
    },

]);

//Gestión y construcción de los resultados de cicloturismo.
bot.dialog('/cicloturismo',
[
    //Se llama al diálogo de "preguntas" para recopilar los datos.
    function (session)
    {
        session.beginDialog('/preguntas');
    },
    
    //Se contruye una HeroCard, con una imagen y un botón que activa la url donde se recogen los parámetros recogidos en el diálogo de " preguntas".
    function (session, results)
    {
        msg = new builder.Message(session)
            .attachments
            ([
                //new builder.ThumbnailCard(session)
                new builder.HeroCard(session)
                    .text("Estupendo, " + session.userData.name + "!, los paisajes y caminos te esperan!")
                    .images
                    ([
                        builder.CardImage.create(session, "https://openclipart.org/image/160px/svg_to_png/174862/1360169932.png")
                    ])
                    .buttons([builder.CardAction.openUrl(session, "http://es.wikiloc.com/rutas/cicloturismo?q="+ session.userData.locality + "&t=" + session.userData.type + "&d=" + session.userData.difficulty + "&" + session.userData.distance + "&src=" + session.userData.origin, "Vamos a ello!")])
            ]);
        session.endConversation(msg);
    },

]);

//Gestión y construcción de los resultados de mountain-bike.
bot.dialog('/mountain-bike',
[
    //Se llama al diálogo de "preguntas" para recopilar los datos.
    function (session)
    {
        session.beginDialog('/preguntas');
    },
     
    //Se contruye una HeroCard, con una imagen y un botón que activa la url donde se recogen los parámetros recogidos en el diálogo de " preguntas".
    function (session, results)
    {
        msg = new builder.Message(session)
            .attachments
            ([
                //new builder.ThumbnailCard(session)
                new builder.HeroCard(session)
                    .text("Dispuest@, " + session.userData.name + "!, no va a haber subida que se te resista!")
                    .images
                    ([
                        builder.CardImage.create(session, "https://openclipart.org/image/160px/svg_to_png/249626/1464343602.png")
                    ])
                    .buttons([builder.CardAction.openUrl(session, "http://es.wikiloc.com/rutas/mountain-bike?q="+ session.userData.locality + "&t=" + session.userData.type + "&d=" + session.userData.difficulty + "&" + session.userData.distance + "&src=" + session.userData.origin, "Vamos a ello!")])
            ]);
        session.endConversation(msg);
    },

]);

//Esté diálogo va haciendo una serie de preguntas y recogiendo los resultados en una serie de parámetros, que se utilizarán para mostrar el resultado final.
bot.dialog('/preguntas',
[

    function (session)
    {
        builder.Prompts.text(session, "¿Podrías indicarme la población?.");
    },
    
    function (session, results)
    {
        session.userData.locality = results.response;
        builder.Prompts.choice(session, "Qué tipo de ruta quieres hacer?", "Sólo ida|Circular|Cualquiera"); 
    },

    function (session, results)
    {
        //session.userData.type = results.response.entity;
        switch (results.response.index)
        {
        	case 0:
            	session.userData.type = 0;
            	break;
        	case 1:
            	session.userData.type = 1;
            	break;
        	case 2:
            	session.userData.type = "";
            	break;
        	default:
                session.endDialog();
                break;
        }

        /*
        if (session.userData.type = "Sólo ida")
        {
            session.userData.type = 0;
        }
        else if(session.userData.type = "Circular")
        {
            session.userData.type = 1;
        }
        else
        {
            session.userData.type = "";
        }*/

        builder.Prompts.choice(session, "¿Dime la dificultad?", "Fácil|Moderado|Difícil|Muy difícil|Sólo expertos");
    },

    function (session, results)
    {
        switch (results.response.index)
        {
            case 0:
                session.userData.difficulty =1;
                break;
            case 1:
                session.userData.difficulty =2;
                break;
            case 2:
                session.userData.difficulty =3;
                break;
            case 3:
                session.userData.difficulty =4;
                break;
            case 4:
                session.userData.difficulty =5;
                break;
            default:
                session.endDialog();
                break;
        }
        builder.Prompts.choice(session, "¿De cuánta distancia?", "Entre 5 y 10 km|Entre 10 y 25 km|Entre 25 y 50 km|Entre 50 y 100 km|Más de 100" ); 
    },

    function (session, results)
    {
        switch (results.response.index)
        {
            case 0:
                session.userData.distance ="lfr=5&lto=10";
                break;
            case 1:
                session.userData.distance ="lfr=10&lto=25";
                break;
            case 2:
                session.userData.distance ="lfr=25&lto=50";
                break;
            case 3:
                session.userData.distance ="lfr=50&lto=100";
                break;
            case 4:
                session.userData.distance ="lfr=100";
                break;
            default:
                session.endDialog();
                break;
        }
        builder.Prompts.choice(session, "¿Y por último el origen del track?", "GPS|Smartphone|Cualquiera"); 
    },
    function (session, results)
    {
        switch (results.response.index)
        {
        	case 0:
            	session.userData.origin = 0;
            	break;
        	case 1:
            	session.userData.origin = 1;
            	break;
        	case 2:
            	session.userData.origin = "";
            	break;
        	default:
                session.endDialog();
                break;
        }
        session.endDialogWithResult();
    }

]);