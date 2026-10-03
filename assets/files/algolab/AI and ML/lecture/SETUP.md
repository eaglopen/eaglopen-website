# Beginner

## Easiest option — Google Colab

1. Open [Google Colab](https://colab.research.google.com/).
2. Sign in, then choose **File → Upload notebook**.
3. Upload the `.ipynb` file.
4. Run each cell with **Shift + Enter**.

Nothing needs to be installed.

## Windows — run notebooks on your computer

1. Download Python from [python.org](https://www.python.org/downloads/), open the
   downloaded installer, and choose **Install**. If it offers **Add Python to PATH**,
   select it.
2. Open **Command Prompt** from the Start menu.
3. Install [NumPy](https://numpy.org/install),
   [Matplotlib](https://matplotlib.org/stable/install/index.html),
   [scikit-learn](https://scikit-learn.org/stable/install.html), and
   [JupyterLab](https://jupyter.org/install):

```bat
python -m pip install numpy matplotlib scikit-learn jupyterlab
```

4. Check the installation:

```bat
python -c "import numpy, matplotlib, sklearn; print('Ready!')"
```

5. Open the folder containing the notebook, then run:

```bat
python -m jupyter lab
```

If `python` is not recognized, reopen Command Prompt and replace `python` with `py`.
On macOS or Linux, use `python3` instead.

> Lecture 3 uses only **NumPy** and **Matplotlib**. Scikit-learn is installed now
> for later lectures.
