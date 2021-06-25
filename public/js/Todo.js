$(document).ready(function(){
    $("#removeButton").click(function(){
        $(".done" ).each(function( index ) {
            $(this).fadeOut(1000,
                function(){
                    $(this).remove();
                });
          });
    });


    $("#addButton").click(function(){
        console.log("adding a new element");

        var taskText = $("#taskInput").val();
        console.log(taskText);

        $("<div class=\"active\" style=\"display: none;\"><input type=\"checkbox\"></input><span class=\"pl10\">"
        + taskText + 
        "</span><button class=\"right\">Abandon</button></div>"
        ).insertBefore("#newTask");

        $("#newTask").prev().fadeIn();
    });


    $(document).on('change', 'input[type=checkbox]', function(e) {
        console.log("checking the item");
        if(this.checked){
            $(this).parent().addClass("done").removeClass("active");
            $(this).siblings("button").css("visibility", "hidden");
        }
        else{
            $(this).siblings("button").css("visibility", "visible");
            $(this).parent().addClass("active").removeClass("done");
        }
    });

  });
