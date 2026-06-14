const server_url = 'http://localhost:3000';

function printMessage(condition, message) {
  if (condition) {
    console.log('passed the test:', message);
  } else {
    console.log('failed the test', message);
  }
}

async function runTests() {
  console.log('Starting tests...\n');

  try {


    // test no.1:  is to create a list
    console.log('test 1:  create a list');
    const listRes = await fetch(`${server_url}/lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test list' })
    });
    const list = await listRes.json();
    const listId = list.id;
    printMessage(list.id && list.name === 'test list', 'List created successfully');
    


    // test no.2:  is to add 5 items into the previous list created using its id
    console.log('test 2: add five items');
    const itemNames = ['1', '2', '3', '4', '5'];
    const itemIds = [];

    for (const name of itemNames) {
      const res = await fetch(`${server_url}/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const item = await res.json();
      itemIds.push(item.id);
    }

    printMessage(itemIds.length === 5, 'all 5 items added');
    console.log();



    // test no.3:  fetch all items and see thier positions 
    console.log('test 3:  verify the initial positions , should be (1,2,3,4,5)');
    const itemsRes = await fetch(`${server_url}/lists/${listId}/items`);
    const items = await itemsRes.json();
    const positions = items.map(i => i.position);
    printMessage(
      JSON.stringify(positions) === JSON.stringify([1, 2, 3, 4, 5]),
      'positions are correct 1,2,3,4,5'
    );
    console.log();



    // test no.4:  move one item to another position >  item number 3 (position 3) to position 1
    console.log('test 4: move Item3 (position 3) to position 1');
    const item3Id = itemIds[2]; 
    const moveRes = await fetch(`${server_url}/items/${item3Id}/position`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: 1 })
    });
    const moveResult = await moveRes.json();
    printMessage(moveResult.position === 1, 'Item moved to position 1');
    const itemsAfterMove = await (await fetch(`${server_url}/lists/${listId}/items`)).json();
    const itemNamesAfterMove = itemsAfterMove.map(i => i.name);
    const expectedOrder = ['3', '1', '2', '4', '5'];
    printMessage(
      JSON.stringify(itemNamesAfterMove) === JSON.stringify(expectedOrder),
      `Order is ${expectedOrder.join(', ')}`
    );
    console.log();


    
    // test no.5:   fetch all items again and see thier positions to verify no gaps between them
    console.log('test 5: verify that there is no gaps in positions after move');
    const itemsprintMessage = await (await fetch(`${server_url}/lists/${listId}/items`)).json();
    const positionsprintMessage = itemsprintMessage.map(i => i.position);
    printMessage(
      JSON.stringify(positionsprintMessage) === JSON.stringify([1, 2, 3, 4, 5]),
      'Positions still 1,2,3,4,5 with no gaps'
    );
    console.log();


    
    // test no.6: move the item to position 0 (should be invalid)
    console.log('test 6: try to move to position 0 (should fail)');
    const invalidMove1 = await fetch(`${server_url}/items/${item3Id}/position`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: 0 })
    });
    printMessage(invalidMove1.status === 400, 'Correctly rejected position 0 with 400');
    console.log();



    // test no.7: move the item to position 99 (should be invalid)
    console.log('test 7: try to move to position 99 (should fail)');
    const invalidMove2 = await fetch(`${server_url}/items/${item3Id}/position`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: 99 })
    });
    printMessage(invalidMove2.status === 400, 'Correctly rejected position 99 with 400');
    console.log();



    // test no.8: fetch non-existent item
    console.log('test 8: fetch non-existent item (id: 99999)');
    const notFoundRes = await fetch(`${server_url}/items/99999`);
    printMessage(notFoundRes.status === 404, 'Correctly returned 404 for non-existent item');
    console.log();



    // test no.9: delete the item at position 3
    console.log('test 9: delete item at position 3');
    const itemsBeforeDel = await (await fetch(`${server_url}/lists/${listId}/items`)).json();
    const itemToDelete = itemsBeforeDel[2]; 
    const deleteRes = await fetch(`${server_url}/items/${itemToDelete.id}`, {
      method: 'DELETE'
    });
    printMessage(deleteRes.status === 200, 'Item deleted successfully');
    console.log();

    

    // test no.10: verify all positions after delete
    console.log('test 10: Verify positions after delete (should be 1,2,3,4)');
    const itemsAfterDel = await (await fetch(`${server_url}/lists/${listId}/items`)).json();
    const positionsAfterDel = itemsAfterDel.map(i => i.position);
    printMessage(
      JSON.stringify(positionsAfterDel) === JSON.stringify([1, 2, 3, 4]),
      'Positions are correctly 1,2,3,4 with no gaps'
    );
    printMessage(itemsAfterDel.length === 4, 'Total items is now 4');
    console.log();

    console.log('All tests completed!');
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

runTests();
