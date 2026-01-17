import React, { useState, useMemo } from 'react';
import { Search, Download, Users, Mail, Phone, FileText } from 'lucide-react';
import { type ParsedOrder } from '../utils/csvParser';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CustomerListsProps {
  data: ParsedOrder[];
}

export function CustomerLists({ data }: CustomerListsProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleClassSelection = (className: string) => {
    setSelectedClass(className);
    // Smooth scroll to the customer list section
    setTimeout(() => {
      const customerListElement = document.getElementById('customer-list-section');
      if (customerListElement) {
        customerListElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100); // Small delay to ensure the component has rendered
  };

  const classesList = useMemo(() => {
    const classMap = data.reduce((acc, order) => {
      const className = order.className;
      if (!acc[className]) {
        acc[className] = {
          name: className,
          customers: new Map<string, ParsedOrder>(),
          totalQuantity: 0
        };
      }
      
      const existingCustomer = acc[className].customers.get(order.customerEmail);
      if (!existingCustomer || new Date(order.orderDate + ' ' + order.orderTime) > new Date(existingCustomer.orderDate + ' ' + existingCustomer.orderTime)) {
        acc[className].customers.set(order.customerEmail, order);
      }
      acc[className].totalQuantity += order.quantity;
      return acc;
    }, {} as Record<string, { name: string; customers: Map<string, ParsedOrder>; totalQuantity: number }>);

    return Object.values(classMap).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [data]);

  const selectedClassData = useMemo(() => {
    if (!selectedClass) return null;
    return classesList.find(cls => cls.name === selectedClass);
  }, [classesList, selectedClass]);

  const filteredCustomers = useMemo(() => {
    if (!selectedClassData) return [];
    
    const customers = Array.from(selectedClassData.customers.values());
    const filtered = customers.filter(customer =>
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Sort alphabetically by last name
    return filtered.sort((a, b) => {
      const getLastName = (fullName: string) => {
        const nameParts = fullName.trim().split(' ');
        return nameParts[nameParts.length - 1].toLowerCase();
      };
      
      const lastNameA = getLastName(a.customerName);
      const lastNameB = getLastName(b.customerName);
      
      return lastNameA.localeCompare(lastNameB);
    });
  }, [selectedClassData, searchTerm]);

  const exportCustomerList = () => {
    if (!filteredCustomers.length) return;

    const csvContent = [
      'Customer Name,Email,Phone,Order Date,Quantity,Order ID',
      ...filteredCustomers.map(customer => 
        `"${customer.customerName}","${customer.customerEmail}","${customer.customerPhone}","${customer.orderDate}",${customer.quantity},"${customer.orderId}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ebony-fit-${selectedClass.toLowerCase().replace(/[^a-z0-9]/g, '-')}-customers.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCustomerListPDF = () => {
    if (!filteredCustomers.length || !selectedClass) return;

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Ebony Fit Weekend - Customer List', 20, 25);

    // Add class name
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Class: ${selectedClass}`, 20, 40);

    // Add summary info
    doc.setFontSize(12);
    doc.text(`Total Customers: ${filteredCustomers.length}`, 20, 50);
    doc.text(`Total Tickets: ${selectedClassData?.totalQuantity || 0}`, 20, 58);
    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 66);

    // Prepare table data
    const tableData = filteredCustomers.map((customer, index) => [
      index + 1,
      customer.customerName,
      customer.customerEmail,
      customer.customerPhone || 'N/A',
      customer.quantity.toString(),
      customer.orderDate
    ]);

    // Add table
    autoTable(doc, {
      head: [['#', 'Customer Name', 'Email', 'Phone', 'Tickets', 'Order Date']],
      body: tableData,
      startY: 75,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue color
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 }, // # column
        1: { cellWidth: 40 }, // Name column
        2: { cellWidth: 50 }, // Email column
        3: { cellWidth: 30 }, // Phone column
        4: { halign: 'center', cellWidth: 18 }, // Tickets column
        5: { cellWidth: 30 }, // Date column
      },
      margin: { left: 10, right: 10 },
    });

    // Save the PDF
    const fileName = `ebony-fit-${selectedClass.toLowerCase().replace(/[^a-z0-9]/g, '-')}-customers.pdf`;
    doc.save(fileName);
  };

  const exportAllClassesCSV = () => {
    if (!classesList.length) return;

    const csvRows: string[] = [];

    // Add header row
    csvRows.push('Class Name,Customer Name,Email,Phone,Order Date,Quantity,Order ID');

    // Loop through each class
    classesList.forEach((cls) => {
      const customers = Array.from(cls.customers.values()).sort((a, b) => {
        const getLastName = (fullName: string) => {
          const nameParts = fullName.trim().split(' ');
          return nameParts[nameParts.length - 1].toLowerCase();
        };

        const lastNameA = getLastName(a.customerName);
        const lastNameB = getLastName(b.customerName);

        return lastNameA.localeCompare(lastNameB);
      });

      // Add each customer row
      customers.forEach((customer) => {
        csvRows.push(
          `"${cls.name}","${customer.customerName}","${customer.customerEmail}","${customer.customerPhone}","${customer.orderDate}",${customer.quantity},"${customer.orderId}"`
        );
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ebony-fit-all-customer-lists.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportAllClassesPDF = () => {
    if (!classesList.length) return;

    const doc = new jsPDF();

    // Add main title
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Ebony Fit Weekend - All Customer Lists', 20, 25);

    // Add summary info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const totalCustomers = classesList.reduce((sum, cls) => sum + cls.customers.size, 0);
    const totalTickets = classesList.reduce((sum, cls) => sum + cls.totalQuantity, 0);
    doc.text(`Total Classes: ${classesList.length}`, 20, 38);
    doc.text(`Total Customers: ${totalCustomers}`, 20, 46);
    doc.text(`Total Tickets: ${totalTickets}`, 20, 54);
    doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 62);

    let currentY = 75;

    // Loop through each class
    classesList.forEach((cls, classIndex) => {
      const customers = Array.from(cls.customers.values()).sort((a, b) => {
        const getLastName = (fullName: string) => {
          const nameParts = fullName.trim().split(' ');
          return nameParts[nameParts.length - 1].toLowerCase();
        };

        const lastNameA = getLastName(a.customerName);
        const lastNameB = getLastName(b.customerName);

        return lastNameA.localeCompare(lastNameB);
      });

      // Add new page if not the first class
      if (classIndex > 0) {
        doc.addPage();
        currentY = 20;
      }

      // Add class header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Class: ${cls.name}`, 20, currentY);

      // Add class summary
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${customers.length} customers • ${cls.totalQuantity} tickets`, 20, currentY + 8);

      // Prepare table data
      const tableData = customers.map((customer, index) => [
        index + 1,
        customer.customerName,
        customer.customerEmail,
        customer.customerPhone || 'N/A',
        customer.quantity.toString(),
        customer.orderDate
      ]);

      // Add table
      autoTable(doc, {
        head: [['#', 'Customer Name', 'Email', 'Phone', 'Tickets', 'Order Date']],
        body: tableData,
        startY: currentY + 15,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 38 },
          2: { cellWidth: 48 },
          3: { cellWidth: 28 },
          4: { halign: 'center', cellWidth: 16 },
          5: { cellWidth: 28 },
        },
        margin: { left: 10, right: 10 },
      });
    });

    // Save the PDF
    doc.save('ebony-fit-all-customer-lists.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Customer Lists by Class</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportAllClassesCSV}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export All CSV</span>
            </button>
            <button
              onClick={exportAllClassesPDF}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <FileText className="w-4 h-4" />
              <span>Export All PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {classesList.map((cls) => (
            <div
              key={cls.name}
              onClick={() => handleClassSelection(cls.name)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedClass === cls.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <h3 className="font-medium text-gray-900 mb-2 leading-tight">{cls.name}</h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{cls.customers.size} customers</span>
                <span className="text-blue-600 font-medium">{cls.totalQuantity} tickets</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedClassData && (
        <div id="customer-list-section" className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedClass}</h3>
                <p className="text-gray-600">
                  {filteredCustomers.length} customers • {selectedClassData.totalQuantity} total tickets
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportCustomerList}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={exportCustomerListPDF}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredCustomers.map((customer) => (
              <div key={customer.customerEmail} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{customer.customerName}</h4>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{customer.customerEmail}</span>
                      </div>
                      {customer.customerPhone && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{customer.customerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{customer.quantity} tickets</p>
                    <p className="text-xs text-gray-500 mt-1">{customer.orderDate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No customers found for this search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}