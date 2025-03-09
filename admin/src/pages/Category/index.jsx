import React, { useEffect, useState, useRef } from "react";
import Button from "@mui/material/Button";
import { FaPencilAlt } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Link } from "react-router-dom";
import { emphasize, styled } from "@mui/material/styles";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import HomeIcon from "@mui/icons-material/Home";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { deleteData, editData, fetchDataFromApi } from "../../utils/api";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { CircularProgress } from "@mui/material";
import Checkbox from "@mui/material/Checkbox";
import TablePagination from "@mui/material/TablePagination"; // Import pagination

const label = { inputProps: { "aria-label": "Checkbox demo" } };

// Breadcrumb styling
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? theme.palette.grey[100]
      : theme.palette.grey[800];

  return {
    backgroundColor,
    height: theme.spacing(3),
    color: theme.palette.text.primary,
    fontWeight: theme.typography.fontWeightRegular,
    "&:hover, &:focus": {
      backgroundColor: emphasize(backgroundColor, 0.06),
    },
    "&:active": {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const Category = () => {
  const [catData, setCatData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formFields, setFormFields] = useState({
    name: "",
    images: "",
    color: "",
  });

  const [page, setPage] = useState(0); // State to manage page
  const [rowsPerPage, setRowsPerPage] = useState(5); // State to manage rows per page

  const firstInputRef = useRef(null); // Reference to the first input field

  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      console.log("API Response:", res);
      if (res && res.data) {
        setCatData(res.data || []);
      }
    });
  }, []);

  useEffect(() => {
    if (open) {
      // Focus on the first input field when the dialog opens
      firstInputRef.current?.focus();
    }
  }, [open]);

  const handleClose = () => {
    setOpen(false);
  };

  const changeInput = (e) => {
    setFormFields({
      ...formFields,
      [e.target.name]: e.target.value,
    });
  };

  const editCategory = (id) => {
    setOpen(true);
    setEditId(id);

    fetchDataFromApi(`/api/category/${id}`)
      .then((res) => {
        if (res && res.data) {
          setFormFields({
            name: res.data.name || "",
            images: res.data.images?.[0] || "",
            color: res.data.color || "",
          });
        }
      })
      .catch((error) => console.error("Error fetching category:", error));
  };

  const categoryEditFun = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Ensure images is sent as an array
    const updatedFormFields = {
      ...formFields,
      images: Array.isArray(formFields.images) ? formFields.images : [formFields.images],
    };

    editData(`/api/category/${editId}`, updatedFormFields)
      .then(() => {
        fetchDataFromApi("/api/category").then((res) => {
          setCatData(res.data || []);
          setOpen(false);
          setIsLoading(false);
        });
      })
      .catch((error) => {
        console.error("Error updating category:", error);
        setIsLoading(false);
      });
  };

  const deleteCat = (id) => {
    deleteData(`/api/category/${id}`)
      .then(() => {
        fetchDataFromApi("/api/category").then((res) => {
          setCatData(res.data || []);
        });
      })
      .catch((error) => console.error("Error deleting category:", error));
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page when rows per page change
  };

  return (
    <div id="root" inert={open}>
      <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4 align-items-center">
          <h5 className="mb-0">Category List</h5>
          <div className="ml-auto d-flex align-items-center">
            <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
              <StyledBreadcrumb
                component="a"
                href="#"
                label="Dashboard"
                icon={<HomeIcon fontSize="small" />}
              />
              <StyledBreadcrumb label="Category" deleteIcon={<ExpandMoreIcon />} />
            </Breadcrumbs>
            <Link to="/category/add">
              <Button className="btn-blue ml-3 pl-3 pr-3">Add Category</Button>
            </Link>
          </div>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
          <div className="table-responsive mt-3">
            <table className="table table-bordered table-striped v-align">
              <thead className="thead-dark">
                <tr>
                  <th>UID</th>
                  <th style={{ width: "100px" }}>IMAGE</th>
                  <th>CATEGORY</th>
                  <th>COLOR</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {catData.length > 0 &&
                  catData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <tr key={item._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <Checkbox {...label} />
                            <span>#{index + 1}</span>
                          </div>
                        </td>
                        <td>
                          <div
                            className="imgWrapper"
                            style={{ width: "50px", flex: "0 0 50px" }}
                          >
                            <div className="img card shadow m-0">
                              <img
                                src={item.images?.[0] || "fallback-image-url"}
                                className="w-100"
                                alt="Category"
                              />
                            </div>
                          </div>
                        </td>
                        <td>{item.name}</td>
                        <td>{item.color}</td>
                        <td>
                          <div className="actions d-flex align-items-center">
                            <Button
                              className="success"
                              color="success"
                              onClick={() => editCategory(item._id)}
                              aria-label="Edit Category"
                            >
                              <FaPencilAlt />
                            </Button>
                            <Button
                              className="error"
                              color="error"
                              onClick={() => deleteCat(item._id)}
                              disabled={isLoading}
                              aria-label="Delete Category"
                            >
                              <MdDelete />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={catData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </div>
      </div>

      {/* Dialog Box for Editing Category */}
      <Dialog open={open} onClose={handleClose} disableEnforceFocus>
        <DialogTitle>Edit Category</DialogTitle>
        <form onSubmit={categoryEditFun}>
          <DialogContent>
            <TextField
              autoFocus
              required
              margin="dense"
              name="name"
              label="Category Name"
              type="text"
              fullWidth
              value={formFields.name}
              onChange={changeInput}
              inputRef={firstInputRef} // Attach the ref to the first input
            />
            <TextField
              required
              margin="dense"
              name="images"
              label="Category Image URL"
              type="text"
              fullWidth
              value={formFields.images}
              onChange={changeInput}
            />
            <TextField
              required
              margin="dense"
              name="color"
              label="Category Color"
              type="text"
              fullWidth
              value={formFields.color}
              onChange={changeInput}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" variant="contained">
              {isLoading ? <CircularProgress size={24} /> : "Submit"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Category;
