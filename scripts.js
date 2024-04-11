function searchTransactions() {
   
    const searchInput = document.getElementById('search-input').value;

    
    document.getElementById('progress').textContent = searchInput;
    document.getElementById('current-expenditure').textContent = searchInput;
    document.getElementById('expected-cost').textContent = searchInput;
    document.getElementById('latest-update').textContent = searchInput;
}
