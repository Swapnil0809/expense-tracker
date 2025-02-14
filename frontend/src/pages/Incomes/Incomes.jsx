import { useState, useEffect } from 'react';
import axios from 'axios';
import "./Incomes.css" 
import { MdDeleteOutline } from "react-icons/md";
import * as XLSX from "xlsx";
import AddUpdateModal from '../../components/AddUpdateModal/AddUpdateModal';
import toast,{Toaster} from "react-hot-toast";
import { parseErrorMessage } from '../../components/ParseErrorMessage';


function Incomes() {
  const [categories, setCategories] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshIncomes, setRefreshIncomes] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [currentIncome, setCurrentIncome] = useState(null);


  useEffect(() => {
    axios.get('/api/v1/categories/get-categories/income')
      .then((res) => {
        console.log(res.data);
        setCategories(res.data.data);
      })
      .catch((err) => console.log(err));

    axios.get("/api/v1/incomes/get-incomes")
      .then((res) => {
        console.log(res.data.data);
        setIncomes(res.data.data);
        setFilteredIncomes(res.data.data); // Initialize filtered incomes
      })
      .catch((err) => console.log(err));
  }, [refreshIncomes]);

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      // If the category is already selected, remove the filter
      setSelectedCategory(null);
      setFilteredIncomes(incomes);
    } else {
      // Set the selected category and filter incomes
      setSelectedCategory(categoryId);
      setFilteredIncomes(incomes.filter(income => income.category === categoryId));
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    filterIncomes(e.target.value);
  };

  const filterIncomes = (searchQuery) => {
    let filtered = incomes;

    if (searchQuery) {
      filtered = filtered.filter(income =>
        income.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        income.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        new Date(income.date).toLocaleDateString().includes(searchQuery)
      );
    }

    setFilteredIncomes(filtered);
  };

  const handleDelete = (id) => {
    axios.delete(`/api/v1/incomes/delete-income/${id}`)
    .then((res)=>{
      console.log(res)
      setRefreshIncomes(prev=>!prev)
      toast.success("income deleted successfully")
    })
    .catch((err)=> {
      console.log(err)
      toast.error(parseErrorMessage(err.response.data))
    });
  }


  const addIncome = (data) => {
    axios.post('/api/v1/incomes/add-income', data)
      .then((res) => {
        console.log(res);
        setRefreshIncomes(prev => !prev); // Trigger refresh
        setShowModal(false); // Close modal after successful submission
        toast.success("income added successfully")
      })
      .catch((err) => {
        console.error(err)
        toast.error(parseErrorMessage(err.response.data))
      });
  };

  const handleEdit = (income) => {
    const category = categories.find((category)=> category._id === income.category)
    setCurrentIncome({
      _id:income._id,
      title:income.title,
      description:income.description,
      amount:income.amount,
      date:income.date,
      category:category?.name
    })
    setIsEditable(true);
    setShowModal(true);
  };

  const editIncome = (data) => {
    axios.patch(`/api/v1/incomes/update-income/${currentIncome._id}`,data)
      .then((res) => {
        console.log(res);
        setRefreshIncomes(prev => !prev); // Trigger refresh
        setShowModal(false); // Close modal after successful submission
        setCurrentIncome(null);
        toast.success("income updated successfully")
      })
      .catch((err) => {
        console.error(err)
        toast.error(parseErrorMessage(err.response.data))
      });
  }

  const exportIncomes = () => {
    const ws = XLSX.utils.json_to_sheet(incomes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Incomes");
    XLSX.writeFile(wb, "incomes.xlsx");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1em" }}>
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      <div className='filtercont'>
        <h2>Categories</h2>
        {categories.length > 0 ? (
          categories.map((category) => (
            <div className='filterbtn'
              style={{ cursor: 'pointer', backgroundColor: selectedCategory === category._id ? 'black' : 'white' }}
              key={category._id}
              onClick={() => handleCategoryClick(category._id)}
            >
              <h3 style={{ cursor: 'pointer', color: selectedCategory === category._id ? 'white' : 'black' }}>
                {category.name}
              </h3>
            </div>
          ))
        ) : (
          "No categories found"
        )}
      </div>
      <div>
        <div className='incomescont'>
          <h2>Incomes</h2>
          <input
          type="text"
          placeholder="Search incomes..."
          value={searchQuery}
          onChange={handleSearch}
          />
          <button onClick={() => setShowModal(true)}>&#43; Add Income</button>
          <button onClick={exportIncomes}>Export Incomes</button>
          {filteredIncomes.length > 0 ? (
            filteredIncomes.map((income) => (
              <div className='income' key={income._id}>
                <div className="cont1">
                  <h3>{income.title}</h3>
                  <h3 style={{color:"green"}}>&#8377;{income.amount}</h3>
                </div>
                <div className="cont2">
                  <p>{income.description}</p>
                </div>
                <div className="cont3">
                  <p>Date: {new Date(income.date).toLocaleDateString()}</p>
                  <p>
                  {income.createdAt===income.updatedAt?("added at: "+new Date(income.createdAt).toLocaleString()):("updated at: "+new Date(income.updatedAt).toLocaleString())}
                  </p>
                </div>
                <div className="cont4">
                  <button className='updtbtn' onClick={()=>handleEdit(income)}>Edit</button>
                  <button className='delbtn' onClick={()=>handleDelete(income._id)}>Delete<MdDeleteOutline size={15}/></button>
                </div>
              </div>
            ))
          ) : (
            "No Incomes"
          )}
        </div>
      </div>

      {/* Modal for Adding Income */}
      <AddUpdateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultValues={{ ...currentIncome, type: "Income" }}
        isEditMode={isEditable}
        onSubmit={isEditable?editIncome:addIncome}
      />
    </div>
  );
}

export default Incomes;
