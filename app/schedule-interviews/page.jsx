"use client"
import React, { useEffect } from 'react'
import Sidebar from '@/components/sidebar'
import { Button } from '@/components/button'
import { CheckIcon, User } from 'lucide-react'
import { useState, useRef } from 'react';
import Image from 'next/image'


const page = () => {
    const [designations, setdesignation] = useState([]);
    const [departments, setdepartments] = useState([]);
    const [locations, setlocations] = useState([]);

    // Dummy data for dropdowns
    // const designations = ["Software Engineer", "Product Manager", "Designer", "QA Engineer"];
    // const departments = ["Engineering", "Product", "Design", "Quality Assurance"];
    // const locations = ["New Delhi", "Gurgaon", "Remote", "Noida"];

    const [checkbox, setCheckbox] = useState('single');


    // Ref for file input
    const fileInputRef = useRef(null);

    // Handler to trigger file input click
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };



    // State to track which page to render
    const [currentPage, setCurrentPage] = React.useState(() => {
        const saved = window.sessionStorage.getItem('currentPage');
        return saved !== null ? Number(saved) : 0;
    });

    React.useEffect(() => {
        window.sessionStorage.setItem('currentPage', currentPage);
    }, [currentPage]);

    // Dummy page components (replace with your actual pages)
    const pages = [
        // Page 1: Your existing code
        (
            <main className='flex flex-row justify-between max-h-[55vh] h-full flex-1 m-2 gap-12'>
                <div className='flex-1 ml-2'>
                    <span>Select the JD</span>
                    <div className="flex gap-4 mt-2">
                        <select name="Designation" className="border rounded px-2 py-1 bg-cyan-500/20">
                            <option className='bg-white' value=""> Designation</option>
                            {designations.map((designation, idx) => (
                                <option className='bg-white' key={idx} value={designation}>{designation}</option>
                            ))}
                        </select>
                        <select name="Department" className="border rounded px-2 py-1 bg-cyan-500/20">
                            <option className='bg-white' value=""> Department</option>
                            {departments.map((department, idx) => (
                                <option className='bg-white' key={idx} value={department}>{department}</option>
                            ))}
                        </select>
                        <select name="Location" className="border rounded px-2 py-1 bg-cyan-500/20" >
                            <option className='bg-white' value=""> Location</option>
                            {locations.map((location, idx) => (
                                <option className='bg-white' key={idx} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                    <ul className='flex flex-col mt-4 gap-3.5 w-[40%]'>
                        <li className="bg-emerald-400/40 px-2 shadow-md">HR Manager</li>
                        <li className="bg-cyan-500/20 px-2 shadow-md">Technical Lead</li>
                        <li className="bg-cyan-500/20 px-2 shadow-md">Product Owner</li>
                    </ul>
                    <div className="flex items-stretch mt-4 justify-center w-full h-full bg-gray-200 rounded-sm shadow-xl">
                        <textarea
                            className="bg-white inset-0 w-full h-[95%] resize-none p-2 m-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 overflow-y-auto overflow-x-hidden"
                            style={{ minHeight: 0 }}
                            defaultValue="hello"
                            contentEditable={false}
                        />
                    </div>
                </div>
                <div className="mt-4 flex flex-col flex-1 items-start gap-3 ">
                    <div className="flex flex-1 gap-6  w-full h-full pl-0  p-12 pt-4 ">
                        <label className="flex items-center gap-1 cursor-pointer">
                            <input
                                ref={fileInputRef}
                                type="file"
                                name=""
                                id=""
                                className="hidden"
                            />
                            <span onClick={handleUploadClick} className="bg-cyan-500/10 px-4 py-1 w-44 rounded-md">Upload Resume</span>
                        </label>
                        <label className="flex items-center gap-1 bg-cyan-500/10 px-4 py-1 rounded-md">
                            Single
                            <input
                                type="radio"
                                checked={checkbox === 'single'}
                                onChange={() => setCheckbox('single')}
                            />
                        </label>
                        <label className="flex items-center gap-1 bg-cyan-500/10 px-4 py-1 rounded-md">
                            Multiple
                            <input
                                type="radio"
                                checked={checkbox === 'multiple'}
                                onChange={() => setCheckbox('multiple')}
                            />
                        </label>
                    </div>
                    <ul className="w-full flex flex-col gap-2">
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 1</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 2</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 3</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 4</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 5</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 6</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 7</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 8</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 9</li>
                        <li className="bg-cyan-500/30 py-0.5 pl-1 rounded-sm">Resume 10</li>
                    </ul>
                    <div className="flex flex-col w-full gap-3 items-end justify-center">
                        <Button variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black"}>
                            Save
                        </Button>
                        <Button onClick={() => { setCurrentPage(1) }} variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black"}>
                            Analyze Resume
                        </Button>
                    </div>
                </div>
            </main>
        ),
        // Page 2 placeholder
        <main className='flex flex-col  h-[90vh] w-[80vw] p-2 gap-12'>
            <div className="flex h-fit flex-col">
                <span className="pl-3">Processing Resumes…</span>
                <ul className="w-[90%] pl-8 pt-2 flex flex-col gap-2">
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <li key={idx} className=" py-0.5 pl-1 rounded-sm flex flex-row items-start gap-4 ">
                            <div className="">
                                <div className="flex items-center bg-cyan-500/30 gap-2 px-4 rounded-md">
                                    <label className='text-sm' htmlFor={`resume-${idx}`}>{`Resume ${idx + 1}`}</label>
                                </div>
                                <div className="text-xs text-gray-700 pl-1.5 flex flex-wrap gap-2">
                                    <span>Experience: 80%</span>
                                    <span>Skill: 60%</span>
                                    <span>Industry: 50%</span>
                                    <span>Leadership: 80%</span>
                                    <span>Initiative: 60%</span>
                                    <span className="font-semibold">Total Resume score: 90%</span>
                                </div>
                            </div>
                            <input
                                type="radio"
                                id={`resume-${idx}`}
                                className="accent-blue-500 mt-2"
                            />
                        </li>
                    ))}
                </ul>
                <div className="flex flex-row w-full gap-3 pt-2.5  items-center justify-between">
                    <Button variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black ml-3"}>
                        Get the Score
                    </Button>
                    <Button onClick={() => { setCurrentPage(2) }} variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 mr-3 to-emerald-500 hover:text-black"}>
                        Proceed
                    </Button>
                </div>
            </div>
            <div className=""></div>
        </main>,
        // Page 3 placeholder
        <main className='flex flex-col  h-[74vh] w-[80vw] p-2 '>
            <span className='p-2'>Select Resumes for Interview Link</span>
            <div className="flex items-center gap-4 p-2">
                <select className="border border-gray-300 rounded-md p-2 py-1 bg-cyan-500/20">
                    <option className='bg-white' value="">Select a resume</option>
                    {Array.from({ length: 10 }).map((_, idx) => (
                        <option className='bg-white' key={idx} value={`resume-${idx}`}>
                            {`Resume ${idx + 1}`}
                        </option>
                    ))}
                </select>
                <div className="flex-[0.5] rounded-md py-1 px-2 bg-emerald-500/50">
                    Resume1 Selected
                </div>
                <span className="">Resume score: 90%</span>
            </div>
            <div className="flex items-center gap-6  p-2">
                <select className="border border-gray-300 rounded-md p-2 py-1 bg-cyan-500/20">
                    <option className='bg-white' value="">Interview Duration</option>
                    <option className='bg-white' value="">
                        15 Min
                    </option>
                    <option className='bg-white' value="">
                        30 Min
                    </option>
                    <option className='bg-white' value="">
                        45 Min
                    </option>
                    <option className='bg-white' value="">
                        1 Hour
                    </option>
                </select>
                <select className="border border-gray-300 rounded-md p-2 py-1 bg-cyan-500/20 ">
                    <option className='bg-white' value="">Interview Type (multi)</option>
                    <option className='bg-white' value="">
                        Behavioral
                    </option>
                    <option className='bg-white' value="">
                        Technical
                    </option>
                    <option className='bg-white' value="">
                        Experience
                    </option>
                    <option className='bg-white' value="">
                        Problem Solving
                    </option>
                    <option className='bg-white' value="">
                        Leadership
                    </option>
                </select>
                <Button variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black ml-3"}>
                    Generate Questions
                </Button>
            </div>

            <div className="min-h-[340px] overflow-scroll overflow-x-hidden">
                <ul className="flex p-2 flex-col gap-1 ">
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 1</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 2</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 3</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 4</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 5</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 6</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 7</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 8</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 9</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 10</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 11</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 12</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 13</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 14</div>
                    </li>
                    <li className=" p-1 px-2 w-full">
                        <span className="">Technical</span>
                        <div className="bg-cyan-500/20 px-2 py-0.5">Question 15</div>
                    </li>
                </ul>
            </div>
            <div className="flex justify-end items-center w-full pt-6">
                <Button onClick={() => { setCurrentPage(3) }} variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black ml-3"}>
                    Proceed for Link
                </Button>

            </div>
        </main>,
        // Page 4 placeholder
        <main className='flex flex-col  h-[74vh] w-[80vw] p-2 '>
            <span className="p-2">Congratulations !!! Your AI Interview Link has been generated</span>
            <div className="flex flex-col items-center ">
                <div className="bg-green-600 flex items-center my-16 justify-center rounded-full p-4">
                    <CheckIcon className='text-white' height={30} width={30} />
                </div>
                <div className="flex items-center justify-between px-6 py-2 bg-gray-400 rounded-2xl w-[60%]">

                    <input className='bg-white min-w-[340px]' value={"http://url/interview/Interview_ID"} type="text" />

                    <Button variant="ghost" size="sm" className={"w-36 bg-gradient-to-t from-blue-600 via-blue-500/75 to-emerald-500 hover:text-black ml-3"}>
                        Copy
                    </Button>
                </div>
            </div>
            <div className="flex mt-8 flex-col justify-center">
                <span className='p-2'>Share the interview link</span>
                <div className="flex items-center  gap-6">

                    <Button variant="ghost" size="sm" className={"w-36 bg-gray-200 hover:text-black ml-3"}>
                        Email
                    </Button>
                    <Button variant="ghost" size="sm" className={"w-36 bg-gray-200 hover:text-black ml-3"}>
                        Teams
                    </Button>
                    <Button variant="ghost" size="sm" className={"w-36 bg-gray-200 hover:text-black ml-3"}>
                        Slack
                    </Button>
                    <Button variant="ghost" size="sm" className={"w-36 bg-gray-200 hover:text-black ml-3"}>
                        WhatsApp
                    </Button>
                </div>

            </div>
        </main>
    ];



    return (
        <>
            <div className="flex min-h-screen w-screen bg-gray-50">
                <Sidebar />
                <div className="w-full">
                    {/* Header */}
                    <header className="bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex justify-between w-full items-center gap-4">
                                <span className="text-gray-600">
                                    Welcome, <span className="text-blue-600 font-medium">Candidate Name</span>
                                </span>
                                <Button variant="ghost" size="sm" className={" w-8 h-8 hover:bg-gray-300 text-black rounded-full border border-black"}>
                                    <User className="w-4 h-4 rounded-full text-black" />
                                </Button>
                            </div>
                        </div>
                    </header >
                    {pages[currentPage]}
                    {/* {renderNav()} */}
                </div>
            </div>
        </>
    );
}

export default page
