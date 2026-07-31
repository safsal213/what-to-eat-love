export const API_URL =
'https://script.google.com/macros/s/AKfycbxnMeo5xc1VpgzJ7kXp5W5Fj-F0gGo7MaItOxHPcb6HboJFGA3nhsKfz1ftoS6i2z9aPA/exec';

export async function fetchAppData() {

  const response = await fetch(API_URL + '?action=data');

  return await response.json();

}

export async function saveSelection(meal){

  const response = await fetch(API_URL,{

      method:'POST',

      headers:{
          'Content-Type':'application/json'
      },

      body:JSON.stringify({

          action:'selectMeal',

          mealId:meal.id,

          mealName:meal.name,

          selectedBy:'מעיין',

          notes:''

      })

  });

  return await response.json();

}
