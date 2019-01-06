import React, { useEffect, useState, useReducer, useRef, Fragment } from 'react';
import { Link, Router, navigate } from '@reach/router';
import PropTypes from 'prop-types';

import db from './db';

function App() {
  return (
    <Fragment>
      <Header />
      <Router>
        <Main path="/" />
        <RecordForm path="/new" />
        <UpdateRecord path="/edit/:_id" />
        <Details path="/details/:_id" />
      </Router>
    </Fragment>
  );
}

function Header() {
  const [modalActive, toggleModalActive] = useState(false);

  return (
    <header className="navbar">
      <section className="navbar-section">
        <Link to="/" className="btn btn-link">
          Listings
        </Link>
        <Link to="/new" className="btn btn-link">
          Add New
        </Link>
      </section>
      <Modal active={modalActive} toggleActive={toggleModalActive} />
      <section className="navbar-section">
        <button
          className="btn btn-link"
          onClick={() => {
            db.purge();
          }}
        >
          Purge Data
        </button>
        <button
          className="btn btn-link"
          onClick={() => {
            db.backupData();
          }}
        >
          Backup data
        </button>

        <button
          className="btn btn-link"
          onClick={() => {
            db.retrieveBackup();
          }}
        >
          Restore from backup
        </button>

        <button
          className="btn btn-link"
          onClick={() => {
            toggleModalActive(true);
          }}
        >
          Import data
        </button>
        <a
          className="btn btn-link"
          href="#download"
          onClick={event => {
            const data = `data:text/json;charset=utf-8,${encodeURIComponent(db.exportData())}`;

            event.target.setAttribute('href', data);
            event.target.setAttribute('download', 'papers.db');
          }}
        >
          Export data
        </a>
      </section>
    </header>
  );
}

function Modal({ active, toggleActive }) {
  const [data, setData] = useState('');
  const [fileLoaded, setFileLoadedState] = useState(false);
  const [fileContentLoaded, setFileContentLoadedState] = useState(false);

  const fileRef = useRef();
  const fileReader = useRef(new FileReader());

  const handleFileUpload = event => {
    const content = event.target.result;
    setData(content);
    setFileContentLoadedState(true);
  };

  useEffect(() => {
    fileReader.current.onload = handleFileUpload;
  }, []);

  const closeModal = event => {
    event.preventDefault();

    toggleActive(false);
  };

  return (
    <div className={`modal modal-lg${active ? ' active' : ''}`}>
      <a href="#close" className="modal-overlay" aria-label="Close" onClick={closeModal} />
      <div className="modal-container">
        <div className="modal-header">
          <a
            href="#close"
            className="btn btn-clear float-right"
            aria-label="Close"
            onClick={closeModal}
          />
          <div className="modal-title h5">Upload .db Data</div>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="db-paste">
              Paste .db content here
            </label>
            {fileContentLoaded && <code>*Content loaded from file</code>}
            <textarea
              className="form-input"
              cols="100"
              rows="8"
              name="db-paste"
              value={data}
              onChange={event => {
                setData(event.target.value);
                setFileContentLoadedState(false);
              }}
            />
          </div>
          <h6 className="text-center">OR</h6>
          <div className="form-group">
            <label className="form-label" htmlFor="db-file">
              Upload a .db file
            </label>
            <input
              className="form-input"
              type="file"
              name="db-file"
              ref={fileRef}
              onChange={event => {
                if (event.target.files[0]) {
                  setFileLoadedState(true);
                } else {
                  setFileLoadedState(false);
                }
              }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            className="btn"
            disabled={!fileLoaded}
            onClick={() => {
              const file = fileRef.current.files[0];
              fileReader.current.readAsText(file, 'utf-8');
            }}
          >
            Read file
          </button>
          {'    '}
          <button
            className="btn btn-primary"
            onClick={() => {
              const confirmation = window.confirm(`If the data is not in correct format you will lose all saved data. Please backup your data before you import untrusted data.
          
          Are you sure you want to import the data?`);

              if (confirmation) {
                db.importData(data);
              }
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

function Main() {
  return (
    <main>
      <Table />
    </main>
  );
}

function Table() {
  const [loading, updateLoading] = useState(true);
  const [listing, updateListing] = useState([]);

  useEffect(() => {
    updateListing(db.find());
    updateLoading(false);
  }, []);

  const deleteEntry = _id => () => {
    db.remove(_id);

    updateListing(db.find());
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (!listing.length) return <h2>No Data Saved</h2>;

  return (
    <table className="table table-responsive table-striped table-hover">
      <thead>
        <tr>
          <th>Sl. No.</th>
          <th>Title</th>
          <th>Authors</th>
          <th>Year</th>
          <th>How I found it?</th>
          <th>My notes</th>
          <th>Points to revisit</th>
          <th>Original link</th>
          <th>Link to highlighted copy</th>
        </tr>
      </thead>
      <tbody>
        {listing.map(
          ({ _id, title, authors, year, found, notes, points, org_link, hl_link }, index) => (
            <tr key={_id}>
              <td>{index + 1}</td>
              <td>
                <Link to={`/details/${_id}`}>{title}</Link>
              </td>
              <td>{authors}</td>
              <td>{year}</td>
              <td>{found}</td>
              <td>{notes}</td>
              <td>{points}</td>
              <td>
                <a href={org_link} rel="noopener noreferrer" target="_blank">
                  Original Paper
                </a>
              </td>
              <td>
                <a href={hl_link} rel="noopener noreferrer" target="_blank">
                  Highlighted Paper
                </a>
              </td>
              <td>
                <Link to={`/edit/${_id}`}>Edit</Link>
              </td>
              <td>
                <button className="btn" onClick={deleteEntry(_id)}>
                  Delete
                </button>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}

function RecordForm({ _id, title, authors, year, found, notes, points, org_link, hl_link }) {
  const [formFieldsState, updateFormFieldsState] = useReducer(
    function(state, { name, value }) {
      return { ...state, [name]: value };
    },
    {
      title,
      authors,
      year,
      found,
      notes,
      points,
      org_link,
      hl_link,
    }
  );

  const onChange = event => {
    updateFormFieldsState({
      name: event.target.name,
      value: event.target.value,
    });
  };

  const onSubmit = event => {
    event.preventDefault();

    const invalids = Object.entries(formFieldsState).filter(([key, value]) => !Boolean(value));

    if (invalids.length) {
      alert(`${invalids.map(([key, value]) => key).join(' ')} - fields are empty`);
    } else {
      if (_id) db.update(_id, formFieldsState);
      else db.add(formFieldsState);

      navigate('/');
    }
  };

  return (
    <form method="POST" className="form-horizontal" onSubmit={onSubmit}>
      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="title">
            Title
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            onChange={onChange}
            value={formFieldsState.title}
            name="title"
            type="text"
            placeholder="Study of a fascinating subject"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="authors">
            Authors
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            onChange={onChange}
            value={formFieldsState.authors}
            name="authors"
            type="text"
            placeholder="John Doe, Jane Doe"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="year">
            Year
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            onChange={onChange}
            value={formFieldsState.year}
            name="year"
            type="text"
            pattern="[1-2][0-9][0-9][0-9]"
            placeholder="1995"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="found">
            How I found it?
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <textarea
            className="form-input"
            onChange={onChange}
            value={formFieldsState.found}
            name="found"
            placeholder="Found it on IEEE Xplore"
            rows="3"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="notes">
            My Notes
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <textarea
            className="form-input"
            onChange={onChange}
            value={formFieldsState.notes}
            name="notes"
            placeholder="Drawbacks that can be improved"
            rows="3"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="points">
            Points to revisit
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <textarea
            className="form-input"
            onChange={onChange}
            value={formFieldsState.points}
            name="points"
            placeholder="The activation function logic"
            rows="3"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="org_link">
            Original link
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            onChange={onChange}
            value={formFieldsState.org_link}
            name="org_link"
            type="text"
            placeholder="https://ieeexplore.org/xyz"
          />
        </div>
      </div>

      <div className="form-group">
        <div className="col-3 col-sm-12">
          <label className="form-label" htmlFor="hl_link">
            Link to highlighted copy
          </label>
        </div>
        <div className="col-9 col-sm-12">
          <input
            className="form-input"
            onChange={onChange}
            value={formFieldsState.hl_link}
            name="hl_link"
            type="text"
            placeholder="https://drive.google.com/xyz"
          />
        </div>
      </div>
      <button type="submit" className="btn btn-primary">
        Submit
      </button>
    </form>
  );
}

function UpdateRecord({ _id }) {
  const [loading, updateLoading] = useState(true);
  const [propsToPass, updatePropsToPass] = useState({});

  useEffect(() => {
    updatePropsToPass(db.findById(_id));
    updateLoading(false);
  }, []);

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return <RecordForm {...propsToPass} />;
}

RecordForm.propTypes = {
  _id: PropTypes.string,
  title: PropTypes.string,
  authors: PropTypes.string,
  year: PropTypes.string,
  found: PropTypes.string,
  notes: PropTypes.string,
  points: PropTypes.string,
  org_link: PropTypes.string,
  hl_link: PropTypes.string,
};

RecordForm.defaultProps = {
  _id: '',
  title: '',
  authors: '',
  year: '',
  found: '',
  notes: '',
  points: '',
  org_link: '',
  hl_link: '',
};

function Details({ _id }) {
  const [loading, updateLoading] = useState(true);
  const [data, updateData] = useState({});

  useEffect(() => {
    updateData(db.findById(_id));
    updateLoading(false);
  }, []);

  const deleteEntry = () => {
    db.remove(_id);

    navigate('/');
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  const { title, authors, year, found, notes, points, org_link, hl_link } = data;

  return (
    <div>
      <h1>
        {title} - <code>{year}</code>
      </h1>
      <h6>{authors}</h6>
      <div>
        <h2>How I found it?</h2>
        <pre>{found}</pre>
      </div>
      <div>
        <h2>My notes</h2>
        <pre>{notes}</pre>
      </div>
      <div>
        <h2>Points to revisit</h2>
        <pre>{points}</pre>
      </div>
      <div>
        <h2>Links</h2>
        <p>
          <a href={org_link} rel="noopener noreferrer" target="_blank">
            Original Paper
          </a>{' '}
          |{'  '}
          <a href={hl_link} rel="noopener noreferrer" target="_blank">
            Highlighted Paper
          </a>
        </p>
      </div>

      <div>
        <h2>Actions</h2>
        <div>
          <Link to={`/edit/${_id}`}>Edit</Link> {'            '}
          <button className="btn" onClick={deleteEntry}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
